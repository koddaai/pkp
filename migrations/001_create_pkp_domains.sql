-- Migration: 001_create_pkp_domains
-- Description: Tracks domains that publish PKP data
-- Created: 2026-02-09

-- Enum for publisher types (manufacturer > retailer > aggregator > community)
CREATE TYPE publisher_type AS ENUM (
    'manufacturer',
    'retailer',
    'aggregator',
    'community'
);

-- Enum for domain status
CREATE TYPE domain_status AS ENUM (
    'active',        -- Domain is actively publishing PKP
    'inactive',      -- Domain was found but PKP not accessible
    'pending',       -- Domain discovered, not yet crawled
    'error',         -- Crawl error
    'deprecated'     -- Domain no longer exists or removed
);

-- Main table for tracking domains that publish PKP
CREATE TABLE pkp_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Domain identity
    domain VARCHAR(255) NOT NULL UNIQUE,

    -- Publisher info (from catalog.json)
    publisher_name VARCHAR(255),
    publisher_type publisher_type NOT NULL DEFAULT 'community',
    publisher_contact VARCHAR(255),

    -- Catalog info
    catalog_url VARCHAR(512) NOT NULL DEFAULT '/.well-known/pkp/catalog.json',
    catalog_type VARCHAR(20) DEFAULT 'single', -- 'single' or 'index' (sharded)
    total_products INTEGER DEFAULT 0,
    categories TEXT[], -- Array of category strings

    -- Status and health
    status domain_status NOT NULL DEFAULT 'pending',
    last_crawl_at TIMESTAMPTZ,
    last_successful_crawl_at TIMESTAMPTZ,
    last_error TEXT,
    crawl_frequency_hours INTEGER DEFAULT 24,

    -- Freshness tracking
    catalog_updated_at TIMESTAMPTZ, -- From catalog.json updated_at
    staleness_days INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN catalog_updated_at IS NOT NULL
            THEN EXTRACT(DAY FROM (NOW() - catalog_updated_at))::INTEGER
            ELSE NULL
        END
    ) STORED,

    -- Metadata
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    discovered_via VARCHAR(100), -- 'manual', 'crawl', 'submission'
    verified_at TIMESTAMPTZ, -- When domain ownership was verified

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_pkp_domains_status ON pkp_domains(status);
CREATE INDEX idx_pkp_domains_publisher_type ON pkp_domains(publisher_type);
CREATE INDEX idx_pkp_domains_last_crawl ON pkp_domains(last_crawl_at);
CREATE INDEX idx_pkp_domains_staleness ON pkp_domains(staleness_days);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pkp_domains_updated_at
    BEFORE UPDATE ON pkp_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table for tracking catalog shards (for large catalogs with type='index')
CREATE TABLE pkp_catalog_shards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES pkp_domains(id) ON DELETE CASCADE,

    category VARCHAR(100) NOT NULL,
    shard_url VARCHAR(512) NOT NULL,
    product_count INTEGER DEFAULT 0,

    last_crawl_at TIMESTAMPTZ,
    last_successful_crawl_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(domain_id, category)
);

CREATE INDEX idx_pkp_catalog_shards_domain ON pkp_catalog_shards(domain_id);

CREATE TRIGGER trigger_pkp_catalog_shards_updated_at
    BEFORE UPDATE ON pkp_catalog_shards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE pkp_domains IS 'Tracks domains that publish PKP data in /.well-known/pkp/';
COMMENT ON COLUMN pkp_domains.publisher_type IS 'Precedence: manufacturer > retailer > aggregator > community';
COMMENT ON COLUMN pkp_domains.staleness_days IS 'Days since last catalog update, computed automatically';
COMMENT ON TABLE pkp_catalog_shards IS 'Tracks shards for large catalogs with type=index';
