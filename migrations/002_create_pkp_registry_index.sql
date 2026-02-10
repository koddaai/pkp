-- Migration: 002_create_pkp_registry_index
-- Description: Index of products from multiple domains for cross-domain search
-- Created: 2026-02-09

-- Enum for confidence levels
CREATE TYPE confidence_level AS ENUM (
    'high',
    'medium',
    'low'
);

-- Enum for confidence sources (precedence order)
CREATE TYPE confidence_source AS ENUM (
    'manufacturer',
    'retailer-feed',
    'community',
    'ai-generated',
    'scraped'
);

-- Enum for price types
CREATE TYPE price_type AS ENUM (
    'msrp',
    'street',
    'range',
    'unknown'
);

-- Enum for availability
CREATE TYPE availability_status AS ENUM (
    'in-stock',
    'out-of-stock',
    'pre-order',
    'discontinued',
    'unknown'
);

-- Main registry index table
CREATE TABLE pkp_registry_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Domain reference
    domain_id UUID NOT NULL REFERENCES pkp_domains(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL, -- Denormalized for faster queries

    -- Product URI (canonical identifier)
    uri VARCHAR(512) NOT NULL UNIQUE, -- pkp://{domain}/{sku}

    -- Identity
    sku VARCHAR(255) NOT NULL,
    gtin VARCHAR(14), -- EAN/UPC
    brand VARCHAR(255) NOT NULL,
    name VARCHAR(500) NOT NULL,

    -- Additional identifiers for cross-domain matching
    mpn VARCHAR(255), -- Manufacturer Part Number
    ean VARCHAR(14),
    asin VARCHAR(20),

    -- Category
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),

    -- Variant info
    family_id VARCHAR(255),
    variant_of VARCHAR(255),
    variant_attributes TEXT[],

    -- Canonical reference
    canonical_domain VARCHAR(255),
    canonical_url VARCHAR(512),

    -- Discovery (L0 data)
    summary TEXT NOT NULL,
    tags TEXT[],
    target_audience TEXT[],
    use_cases TEXT[],

    -- Price
    price_type price_type,
    price_currency VARCHAR(3) DEFAULT 'BRL',
    price_value DECIMAL(12, 2),
    price_min DECIMAL(12, 2),
    price_max DECIMAL(12, 2),
    price_source confidence_source,
    price_updated_at TIMESTAMPTZ,
    availability availability_status DEFAULT 'unknown',
    launch_date DATE,

    -- Confidence (for specs)
    confidence_level confidence_level,
    confidence_source confidence_source,
    confidence_verified_at TIMESTAMPTZ,

    -- Completeness score (0-100)
    completeness_score INTEGER DEFAULT 0,
    meets_threshold BOOLEAN DEFAULT FALSE,

    -- Specs (JSONB for flexibility)
    specs JSONB,

    -- Narrative (from supplier)
    highlights TEXT[],

    -- Reviews aggregate
    reviews_average DECIMAL(2, 1),
    reviews_count INTEGER DEFAULT 0,

    -- Purchase URLs (JSONB array)
    purchase_urls JSONB,
    has_ap2 BOOLEAN DEFAULT FALSE,

    -- Full-text search vector (Portuguese)
    search_vector TSVECTOR,

    -- Source file info
    product_url VARCHAR(512), -- URL to the PRODUCT.md file
    product_updated_at TIMESTAMPTZ, -- From PRODUCT.md frontmatter

    -- Freshness
    staleness_days INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN product_updated_at IS NOT NULL
            THEN EXTRACT(DAY FROM (NOW() - product_updated_at))::INTEGER
            ELSE NULL
        END
    ) STORED,

    -- Timestamps
    indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(domain, sku)
);

-- Primary indexes
CREATE INDEX idx_pkp_registry_domain ON pkp_registry_index(domain);
CREATE INDEX idx_pkp_registry_domain_id ON pkp_registry_index(domain_id);
CREATE INDEX idx_pkp_registry_sku ON pkp_registry_index(sku);
CREATE INDEX idx_pkp_registry_brand ON pkp_registry_index(brand);
CREATE INDEX idx_pkp_registry_category ON pkp_registry_index(category);
CREATE INDEX idx_pkp_registry_subcategory ON pkp_registry_index(subcategory);

-- Cross-domain matching indexes
CREATE INDEX idx_pkp_registry_gtin ON pkp_registry_index(gtin) WHERE gtin IS NOT NULL;
CREATE INDEX idx_pkp_registry_mpn ON pkp_registry_index(mpn) WHERE mpn IS NOT NULL;
CREATE INDEX idx_pkp_registry_ean ON pkp_registry_index(ean) WHERE ean IS NOT NULL;
CREATE INDEX idx_pkp_registry_asin ON pkp_registry_index(asin) WHERE asin IS NOT NULL;
CREATE INDEX idx_pkp_registry_family_id ON pkp_registry_index(family_id) WHERE family_id IS NOT NULL;

-- Discovery indexes
CREATE INDEX idx_pkp_registry_tags ON pkp_registry_index USING GIN(tags);
CREATE INDEX idx_pkp_registry_target_audience ON pkp_registry_index USING GIN(target_audience);

-- Price indexes
CREATE INDEX idx_pkp_registry_price ON pkp_registry_index(price_value) WHERE price_value IS NOT NULL;
CREATE INDEX idx_pkp_registry_price_range ON pkp_registry_index(price_min, price_max) WHERE price_type = 'range';
CREATE INDEX idx_pkp_registry_availability ON pkp_registry_index(availability);

-- Confidence and quality indexes
CREATE INDEX idx_pkp_registry_confidence ON pkp_registry_index(confidence_source, confidence_level);
CREATE INDEX idx_pkp_registry_completeness ON pkp_registry_index(completeness_score);
CREATE INDEX idx_pkp_registry_staleness ON pkp_registry_index(staleness_days);

-- Full-text search index (GIN for tsvector)
CREATE INDEX idx_pkp_registry_search ON pkp_registry_index USING GIN(search_vector);

-- JSONB indexes for specs
CREATE INDEX idx_pkp_registry_specs ON pkp_registry_index USING GIN(specs);

-- Trigger to update search_vector
CREATE OR REPLACE FUNCTION update_pkp_registry_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.brand, '')), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('portuguese', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C') ||
        setweight(to_tsvector('portuguese', COALESCE(array_to_string(NEW.highlights, ' '), '')), 'C') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.category, '')), 'D') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.subcategory, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pkp_registry_search_vector
    BEFORE INSERT OR UPDATE ON pkp_registry_index
    FOR EACH ROW
    EXECUTE FUNCTION update_pkp_registry_search_vector();

-- Trigger to update updated_at
CREATE TRIGGER trigger_pkp_registry_updated_at
    BEFORE UPDATE ON pkp_registry_index
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View for canonical products (resolves duplicates by precedence)
CREATE VIEW pkp_canonical_products AS
WITH ranked_products AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY COALESCE(gtin, mpn, uri)
            ORDER BY
                CASE confidence_source
                    WHEN 'manufacturer' THEN 1
                    WHEN 'retailer-feed' THEN 2
                    WHEN 'community' THEN 3
                    WHEN 'ai-generated' THEN 4
                    WHEN 'scraped' THEN 5
                END,
                completeness_score DESC,
                staleness_days ASC NULLS LAST
        ) as rank
    FROM pkp_registry_index
)
SELECT *
FROM ranked_products
WHERE rank = 1;

-- Comments
COMMENT ON TABLE pkp_registry_index IS 'Central index of products from all PKP domains';
COMMENT ON COLUMN pkp_registry_index.uri IS 'Canonical product URI: pkp://{domain}/{sku}';
COMMENT ON COLUMN pkp_registry_index.search_vector IS 'Full-text search vector for Portuguese language search';
COMMENT ON COLUMN pkp_registry_index.staleness_days IS 'Days since product was last updated';
COMMENT ON VIEW pkp_canonical_products IS 'View that resolves duplicate products by precedence rules';
