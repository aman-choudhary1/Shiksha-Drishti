-- ==========================================================================
-- 008_master_hierarchy.sql
-- Master tables for Chhattisgarh state administrative hierarchy:
-- Districts (33), Blocks (146), Clusters (5540), and Schools (59354).
-- ==========================================================================

-- 1. Districts Master Table
CREATE TABLE IF NOT EXISTS sd_districts (
  id            SERIAL PRIMARY KEY,
  district_cd   TEXT UNIQUE NOT NULL,
  district_name TEXT NOT NULL,
  state_cd      TEXT NOT NULL DEFAULT 'CG',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sd_districts_name ON sd_districts (district_name);

-- 2. Blocks Master Table
CREATE TABLE IF NOT EXISTS sd_blocks (
  id            SERIAL PRIMARY KEY,
  block_cd      TEXT UNIQUE NOT NULL,
  block_name    TEXT NOT NULL,
  district_cd   TEXT NOT NULL,
  district_name TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sd_blocks_dist_cd ON sd_blocks (district_cd);
CREATE INDEX IF NOT EXISTS idx_sd_blocks_dist_name ON sd_blocks (district_name);
CREATE INDEX IF NOT EXISTS idx_sd_blocks_name ON sd_blocks (block_name);

-- 3. Clusters Master Table
CREATE TABLE IF NOT EXISTS sd_clusters (
  id            SERIAL PRIMARY KEY,
  cluster_cd    TEXT UNIQUE NOT NULL,
  cluster_name  TEXT NOT NULL,
  block_cd      TEXT NOT NULL,
  block_name    TEXT NOT NULL,
  district_cd   TEXT NOT NULL,
  district_name TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sd_clusters_block_cd ON sd_clusters (block_cd);
CREATE INDEX IF NOT EXISTS idx_sd_clusters_dist_cd ON sd_clusters (district_cd);
CREATE INDEX IF NOT EXISTS idx_sd_clusters_name ON sd_clusters (cluster_name);

-- 4. Ensure sd_schools allows nullable cluster fields and has fast indexes
ALTER TABLE sd_schools ALTER COLUMN cluster_cd DROP NOT NULL;
ALTER TABLE sd_schools ALTER COLUMN cluster_name DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sd_schools_dist_name ON sd_schools (district_name);
CREATE INDEX IF NOT EXISTS idx_sd_schools_block_name ON sd_schools (block_name);
CREATE INDEX IF NOT EXISTS idx_sd_schools_cluster_name ON sd_schools (cluster_name);
CREATE INDEX IF NOT EXISTS idx_sd_schools_name_trgm ON sd_schools (school_name);
