-- Migration: 004_create_fulltext_search_pt
-- Description: Portuguese full-text search configuration for product search
-- Created: 2026-02-09

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy matching

-- Create custom text search configuration for Portuguese products
-- Based on 'portuguese' but with unaccent support
CREATE TEXT SEARCH CONFIGURATION portuguese_unaccent (COPY = portuguese);

-- Add unaccent to the configuration
ALTER TEXT SEARCH CONFIGURATION portuguese_unaccent
    ALTER MAPPING FOR hword, hword_part, word
    WITH unaccent, portuguese_stem;

-- Create a function to normalize search queries (remove accents, lowercase)
CREATE OR REPLACE FUNCTION normalize_query(query TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(unaccent(query));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create product search function with ranking
CREATE OR REPLACE FUNCTION search_products(
    search_query TEXT,
    category_filter VARCHAR DEFAULT NULL,
    min_price DECIMAL DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL,
    brand_filter VARCHAR DEFAULT NULL,
    source_filter confidence_source DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    uri VARCHAR,
    sku VARCHAR,
    brand VARCHAR,
    name VARCHAR,
    summary TEXT,
    category VARCHAR,
    price_value DECIMAL,
    confidence_source confidence_source,
    completeness_score INTEGER,
    rank REAL
) AS $$
DECLARE
    normalized_query TEXT;
    tsquery_obj TSQUERY;
BEGIN
    -- Normalize the query
    normalized_query := normalize_query(search_query);

    -- Create tsquery with prefix matching
    tsquery_obj := plainto_tsquery('portuguese_unaccent', normalized_query);

    RETURN QUERY
    SELECT
        r.id,
        r.uri,
        r.sku,
        r.brand,
        r.name,
        r.summary,
        r.category,
        r.price_value,
        r.confidence_source,
        r.completeness_score,
        ts_rank_cd(r.search_vector, tsquery_obj, 32) as rank
    FROM pkp_registry_index r
    WHERE
        -- Full-text search match
        r.search_vector @@ tsquery_obj
        -- Category filter
        AND (category_filter IS NULL OR r.category = category_filter OR r.subcategory = category_filter)
        -- Price filters
        AND (min_price IS NULL OR r.price_value >= min_price)
        AND (max_price IS NULL OR r.price_value <= max_price)
        -- Brand filter
        AND (brand_filter IS NULL OR r.brand ILIKE brand_filter)
        -- Source filter
        AND (source_filter IS NULL OR r.confidence_source = source_filter)
    ORDER BY
        -- Rank by relevance and confidence
        CASE r.confidence_source
            WHEN 'manufacturer' THEN 0
            WHEN 'retailer-feed' THEN 1
            WHEN 'community' THEN 2
            WHEN 'ai-generated' THEN 3
            WHEN 'scraped' THEN 4
        END,
        rank DESC,
        r.completeness_score DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Create fuzzy search function for typo tolerance
CREATE OR REPLACE FUNCTION fuzzy_search_products(
    search_query TEXT,
    similarity_threshold REAL DEFAULT 0.3,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    uri VARCHAR,
    name VARCHAR,
    brand VARCHAR,
    similarity REAL
) AS $$
DECLARE
    normalized_query TEXT;
BEGIN
    normalized_query := normalize_query(search_query);

    RETURN QUERY
    SELECT
        r.id,
        r.uri,
        r.name,
        r.brand,
        similarity(normalize_query(r.name || ' ' || r.brand), normalized_query) as sim
    FROM pkp_registry_index r
    WHERE
        similarity(normalize_query(r.name || ' ' || r.brand), normalized_query) > similarity_threshold
    ORDER BY sim DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create autocomplete function for search suggestions
CREATE OR REPLACE FUNCTION autocomplete_products(
    prefix TEXT,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    suggestion TEXT,
    type VARCHAR,
    count BIGINT
) AS $$
DECLARE
    normalized_prefix TEXT;
BEGIN
    normalized_prefix := normalize_query(prefix);

    RETURN QUERY
    -- Product names
    SELECT
        r.name as suggestion,
        'product'::VARCHAR as type,
        COUNT(*) as count
    FROM pkp_registry_index r
    WHERE normalize_query(r.name) LIKE normalized_prefix || '%'
    GROUP BY r.name

    UNION ALL

    -- Brands
    SELECT
        r.brand as suggestion,
        'brand'::VARCHAR as type,
        COUNT(*) as count
    FROM pkp_registry_index r
    WHERE normalize_query(r.brand) LIKE normalized_prefix || '%'
    GROUP BY r.brand

    UNION ALL

    -- Categories
    SELECT
        r.category as suggestion,
        'category'::VARCHAR as type,
        COUNT(*) as count
    FROM pkp_registry_index r
    WHERE normalize_query(r.category) LIKE normalized_prefix || '%'
    GROUP BY r.category

    ORDER BY count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create index for trigram similarity on normalized name+brand
CREATE INDEX idx_pkp_registry_name_trgm
    ON pkp_registry_index
    USING GIN (((name || ' ' || brand)) gin_trgm_ops);

-- Create a table for product synonyms (e.g., "celular" = "smartphone")
CREATE TABLE pkp_search_synonyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term VARCHAR(100) NOT NULL,
    synonyms TEXT[] NOT NULL,
    category VARCHAR(100), -- Category-specific synonyms
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_pkp_synonyms_term ON pkp_search_synonyms(term, category);

-- Insert common product synonyms for Brazilian Portuguese
INSERT INTO pkp_search_synonyms (term, synonyms, category) VALUES
    ('celular', ARRAY['smartphone', 'telefone', 'aparelho', 'mobile'], 'celulares/smartphones'),
    ('notebook', ARRAY['laptop', 'computador portatil', 'portatil'], 'notebooks'),
    ('tv', ARRAY['televisao', 'televisor', 'smart tv', 'tela'], 'tvs'),
    ('fone', ARRAY['headphone', 'fone de ouvido', 'headset', 'earbuds', 'earphone'], NULL),
    ('tenis', ARRAY['calcado', 'sneaker', 'sapato esportivo'], 'moda'),
    ('geladeira', ARRAY['refrigerador', 'freezer'], 'eletrodomesticos'),
    ('maquina de lavar', ARRAY['lavadora', 'lava roupa'], 'eletrodomesticos'),
    ('camera', ARRAY['cam', 'fotografica'], NULL),
    ('bateria', ARRAY['autonomia', 'duracao'], NULL),
    ('tela', ARRAY['display', 'visor', 'painel'], NULL);

-- Function to expand search query with synonyms
CREATE OR REPLACE FUNCTION expand_query_with_synonyms(query TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
    synonym_record RECORD;
    normalized_query TEXT;
BEGIN
    normalized_query := normalize_query(query);
    result := normalized_query;

    FOR synonym_record IN
        SELECT term, synonyms FROM pkp_search_synonyms
        WHERE normalize_query(term) = ANY(string_to_array(normalized_query, ' '))
    LOOP
        -- Add synonyms to query using OR
        result := result || ' | ' || array_to_string(synonym_record.synonyms, ' | ');
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create enhanced search function with synonym expansion
CREATE OR REPLACE FUNCTION search_products_enhanced(
    search_query TEXT,
    category_filter VARCHAR DEFAULT NULL,
    min_price DECIMAL DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0,
    use_synonyms BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    id UUID,
    uri VARCHAR,
    sku VARCHAR,
    brand VARCHAR,
    name VARCHAR,
    summary TEXT,
    category VARCHAR,
    price_value DECIMAL,
    confidence_source confidence_source,
    rank REAL
) AS $$
DECLARE
    expanded_query TEXT;
    tsquery_obj TSQUERY;
BEGIN
    -- Expand query with synonyms if enabled
    IF use_synonyms THEN
        expanded_query := expand_query_with_synonyms(search_query);
    ELSE
        expanded_query := normalize_query(search_query);
    END IF;

    -- Create tsquery (using OR for synonyms)
    tsquery_obj := to_tsquery('portuguese_unaccent', regexp_replace(expanded_query, '\s+', ' & ', 'g'));

    RETURN QUERY
    SELECT
        r.id,
        r.uri,
        r.sku,
        r.brand,
        r.name,
        r.summary,
        r.category,
        r.price_value,
        r.confidence_source,
        ts_rank_cd(r.search_vector, tsquery_obj, 32) as rank
    FROM pkp_registry_index r
    WHERE
        r.search_vector @@ tsquery_obj
        AND (category_filter IS NULL OR r.category = category_filter)
        AND (min_price IS NULL OR r.price_value >= min_price)
        AND (max_price IS NULL OR r.price_value <= max_price)
    ORDER BY
        CASE r.confidence_source
            WHEN 'manufacturer' THEN 0
            WHEN 'retailer-feed' THEN 1
            WHEN 'community' THEN 2
            WHEN 'ai-generated' THEN 3
            WHEN 'scraped' THEN 4
        END,
        rank DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION search_products IS 'Full-text search for products with filters';
COMMENT ON FUNCTION fuzzy_search_products IS 'Fuzzy search for products with typo tolerance';
COMMENT ON FUNCTION autocomplete_products IS 'Autocomplete suggestions for search';
COMMENT ON FUNCTION expand_query_with_synonyms IS 'Expands search query with Portuguese synonyms';
COMMENT ON FUNCTION search_products_enhanced IS 'Enhanced search with synonym expansion';
COMMENT ON TABLE pkp_search_synonyms IS 'Product search synonyms for Portuguese';
