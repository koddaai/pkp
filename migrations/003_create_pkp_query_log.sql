-- Migration: 003_create_pkp_query_log
-- Description: Logging of queries for analytics
-- Created: 2026-02-09

-- Enum for query types
CREATE TYPE query_type AS ENUM (
    'search',           -- Full-text search
    'get_product',      -- Get single product by URI
    'compare',          -- Compare products
    'filter',           -- Filter by category/price/etc
    'alternatives',     -- Get alternatives for a product
    'catalog_fetch',    -- Fetch catalog.json
    'product_fetch'     -- Fetch PRODUCT.md
);

-- Enum for client types
CREATE TYPE client_type AS ENUM (
    'mcp',              -- MCP client
    'rest',             -- REST API
    'cli',              -- CLI tool
    'crawler',          -- Registry crawler
    'studio',           -- PKP Studio
    'agent',            -- AI Agent
    'unknown'
);

-- Main query log table
CREATE TABLE pkp_query_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Query info
    query_type query_type NOT NULL,
    query_text TEXT,                    -- Search query or product URI
    query_params JSONB,                 -- Additional parameters

    -- Context
    client_type client_type DEFAULT 'unknown',
    client_id VARCHAR(255),             -- Agent/client identifier
    session_id VARCHAR(255),            -- Session for grouping queries
    user_agent TEXT,

    -- Target
    domain VARCHAR(255),                -- Domain queried (if specific)
    category VARCHAR(100),              -- Category filter
    product_uri VARCHAR(512),           -- Product URI (if applicable)

    -- Results
    results_count INTEGER DEFAULT 0,
    results_returned INTEGER DEFAULT 0,
    results_uris TEXT[],                -- URIs of returned products

    -- Performance
    duration_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,

    -- Response info
    response_status INTEGER,            -- HTTP status code
    error_message TEXT,

    -- Metadata
    ip_address INET,
    country_code CHAR(2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partition by month for better performance
-- (In production, you'd create monthly partitions)
CREATE INDEX idx_pkp_query_log_created_at ON pkp_query_log(created_at);
CREATE INDEX idx_pkp_query_log_type ON pkp_query_log(query_type);
CREATE INDEX idx_pkp_query_log_client ON pkp_query_log(client_type, client_id);
CREATE INDEX idx_pkp_query_log_domain ON pkp_query_log(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_pkp_query_log_category ON pkp_query_log(category) WHERE category IS NOT NULL;
CREATE INDEX idx_pkp_query_log_session ON pkp_query_log(session_id) WHERE session_id IS NOT NULL;

-- Table for aggregated analytics (materialized for performance)
CREATE TABLE pkp_analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,

    -- Query counts by type
    total_queries INTEGER DEFAULT 0,
    search_queries INTEGER DEFAULT 0,
    product_views INTEGER DEFAULT 0,
    compare_queries INTEGER DEFAULT 0,
    catalog_fetches INTEGER DEFAULT 0,

    -- Client breakdown
    mcp_queries INTEGER DEFAULT 0,
    rest_queries INTEGER DEFAULT 0,
    agent_queries INTEGER DEFAULT 0,

    -- Top categories (JSONB: {category: count})
    top_categories JSONB DEFAULT '{}',

    -- Top domains (JSONB: {domain: count})
    top_domains JSONB DEFAULT '{}',

    -- Top products (JSONB: [{uri, name, views}])
    top_products JSONB DEFAULT '[]',

    -- Top searches (JSONB: [{query, count}])
    top_searches JSONB DEFAULT '[]',

    -- Performance
    avg_duration_ms DECIMAL(10, 2),
    cache_hit_rate DECIMAL(5, 2),

    -- Error tracking
    error_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(date)
);

CREATE INDEX idx_pkp_analytics_date ON pkp_analytics_daily(date);

CREATE TRIGGER trigger_pkp_analytics_updated_at
    BEFORE UPDATE ON pkp_analytics_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table for tracking product views/clicks
CREATE TABLE pkp_product_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Product reference
    product_uri VARCHAR(512) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NOT NULL,

    -- Event type
    event_type VARCHAR(50) NOT NULL, -- 'view', 'compare', 'click_purchase', 'add_to_compare'

    -- Context
    client_type client_type DEFAULT 'unknown',
    client_id VARCHAR(255),
    session_id VARCHAR(255),
    query_id UUID REFERENCES pkp_query_log(id),

    -- Source (how user found the product)
    source VARCHAR(100), -- 'search', 'category', 'alternative', 'direct'
    source_query TEXT,

    -- Metadata
    position INTEGER, -- Position in search results
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pkp_product_events_uri ON pkp_product_events(product_uri);
CREATE INDEX idx_pkp_product_events_domain ON pkp_product_events(domain);
CREATE INDEX idx_pkp_product_events_type ON pkp_product_events(event_type);
CREATE INDEX idx_pkp_product_events_created ON pkp_product_events(created_at);
CREATE INDEX idx_pkp_product_events_session ON pkp_product_events(session_id) WHERE session_id IS NOT NULL;

-- Function to aggregate daily analytics
CREATE OR REPLACE FUNCTION aggregate_daily_analytics(target_date DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO pkp_analytics_daily (
        date,
        total_queries,
        search_queries,
        product_views,
        compare_queries,
        catalog_fetches,
        mcp_queries,
        rest_queries,
        agent_queries,
        avg_duration_ms,
        cache_hit_rate,
        error_count
    )
    SELECT
        target_date,
        COUNT(*) as total_queries,
        COUNT(*) FILTER (WHERE query_type = 'search') as search_queries,
        COUNT(*) FILTER (WHERE query_type = 'get_product') as product_views,
        COUNT(*) FILTER (WHERE query_type = 'compare') as compare_queries,
        COUNT(*) FILTER (WHERE query_type = 'catalog_fetch') as catalog_fetches,
        COUNT(*) FILTER (WHERE client_type = 'mcp') as mcp_queries,
        COUNT(*) FILTER (WHERE client_type = 'rest') as rest_queries,
        COUNT(*) FILTER (WHERE client_type = 'agent') as agent_queries,
        AVG(duration_ms) as avg_duration_ms,
        AVG(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
        COUNT(*) FILTER (WHERE response_status >= 400) as error_count
    FROM pkp_query_log
    WHERE created_at >= target_date AND created_at < target_date + INTERVAL '1 day'
    ON CONFLICT (date) DO UPDATE SET
        total_queries = EXCLUDED.total_queries,
        search_queries = EXCLUDED.search_queries,
        product_views = EXCLUDED.product_views,
        compare_queries = EXCLUDED.compare_queries,
        catalog_fetches = EXCLUDED.catalog_fetches,
        mcp_queries = EXCLUDED.mcp_queries,
        rest_queries = EXCLUDED.rest_queries,
        agent_queries = EXCLUDED.agent_queries,
        avg_duration_ms = EXCLUDED.avg_duration_ms,
        cache_hit_rate = EXCLUDED.cache_hit_rate,
        error_count = EXCLUDED.error_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE pkp_query_log IS 'Log of all queries to the PKP registry';
COMMENT ON TABLE pkp_analytics_daily IS 'Pre-aggregated daily analytics for dashboard';
COMMENT ON TABLE pkp_product_events IS 'Tracks individual product views and interactions';
COMMENT ON FUNCTION aggregate_daily_analytics IS 'Aggregates query logs into daily analytics';
