-- Migration: Add tables for spec coverage filtering
-- Purpose: Enable per-spec talent filtering in spec-coverage command
-- Tables: trait_cond, trait_node_group, trait_node_group_x_trait_node,
--         trait_node_group_x_trait_cond, spec_set_member, trait_node_x_trait_cond

-- 1. Create spec_set_member table
-- Maps abstract SpecSetID values to actual ChrSpecializationID values
CREATE TABLE IF NOT EXISTS raw_dbc.spec_set_member (
    "ID" integer PRIMARY KEY,
    "ChrSpecializationID" integer NOT NULL,
    "SpecSet" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spec_set_member_spec_set
    ON raw_dbc.spec_set_member ("SpecSet");
CREATE INDEX IF NOT EXISTS idx_spec_set_member_chr_spec
    ON raw_dbc.spec_set_member ("ChrSpecializationID");

-- 2. Create trait_cond table
-- Contains conditions that restrict talent access, including SpecSetID for spec filtering
CREATE TABLE IF NOT EXISTS raw_dbc.trait_cond (
    "ID" integer PRIMARY KEY,
    "AchievementID" integer NOT NULL DEFAULT 0,
    "CondType" integer NOT NULL DEFAULT 0,
    "Flags" integer NOT NULL DEFAULT 0,
    "FreeSharedStringID" integer NOT NULL DEFAULT 0,
    "GrantedRanks" integer NOT NULL DEFAULT 0,
    "QuestID" integer NOT NULL DEFAULT 0,
    "RequiredLevel" integer NOT NULL DEFAULT 0,
    "SpecSetID" integer NOT NULL DEFAULT 0,
    "SpendMoreSharedStringID" integer NOT NULL DEFAULT 0,
    "SpentAmountRequired" integer NOT NULL DEFAULT 0,
    "TraitCondAccountElementID" integer NOT NULL DEFAULT 0,
    "TraitCurrencyID" integer NOT NULL DEFAULT 0,
    "TraitNodeEntryID" integer NOT NULL DEFAULT 0,
    "TraitNodeGroupID" integer NOT NULL DEFAULT 0,
    "TraitNodeID" integer NOT NULL DEFAULT 0,
    "TraitTreeID" integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_trait_cond_tree
    ON raw_dbc.trait_cond ("TraitTreeID");
CREATE INDEX IF NOT EXISTS idx_trait_cond_spec_set
    ON raw_dbc.trait_cond ("SpecSetID");
CREATE INDEX IF NOT EXISTS idx_trait_cond_node_group
    ON raw_dbc.trait_cond ("TraitNodeGroupID");
CREATE INDEX IF NOT EXISTS idx_trait_cond_type
    ON raw_dbc.trait_cond ("CondType");

-- 3. Create trait_node_group table
-- Defines groups of nodes within a tree
CREATE TABLE IF NOT EXISTS raw_dbc.trait_node_group (
    "ID" integer PRIMARY KEY,
    "Flags" integer NOT NULL DEFAULT 0,
    "TraitTreeID" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trait_node_group_tree
    ON raw_dbc.trait_node_group ("TraitTreeID");

-- 4. Create trait_node_group_x_trait_node table
-- Maps which nodes belong to which groups
CREATE TABLE IF NOT EXISTS raw_dbc.trait_node_group_x_trait_node (
    "ID" integer PRIMARY KEY,
    "TraitNodeGroupID" integer NOT NULL,
    "TraitNodeID" integer NOT NULL,
    "_Index" integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_trait_node_group_x_trait_node_group
    ON raw_dbc.trait_node_group_x_trait_node ("TraitNodeGroupID");
CREATE INDEX IF NOT EXISTS idx_trait_node_group_x_trait_node_node
    ON raw_dbc.trait_node_group_x_trait_node ("TraitNodeID");

-- 5. Create trait_node_group_x_trait_cond table
-- Links groups to their conditions (including spec restrictions)
CREATE TABLE IF NOT EXISTS raw_dbc.trait_node_group_x_trait_cond (
    "ID" integer PRIMARY KEY,
    "TraitCondID" integer NOT NULL,
    "TraitNodeGroupID" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trait_node_group_x_trait_cond_cond
    ON raw_dbc.trait_node_group_x_trait_cond ("TraitCondID");
CREATE INDEX IF NOT EXISTS idx_trait_node_group_x_trait_cond_group
    ON raw_dbc.trait_node_group_x_trait_cond ("TraitNodeGroupID");

-- 6. Create trait_node_x_trait_cond table
-- Links individual nodes to conditions (for gate nodes)
CREATE TABLE IF NOT EXISTS raw_dbc.trait_node_x_trait_cond (
    "ID" integer PRIMARY KEY,
    "TraitCondID" integer NOT NULL,
    "TraitNodeID" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trait_node_x_trait_cond_cond
    ON raw_dbc.trait_node_x_trait_cond ("TraitCondID");
CREATE INDEX IF NOT EXISTS idx_trait_node_x_trait_cond_node
    ON raw_dbc.trait_node_x_trait_cond ("TraitNodeID");

-- Enable Row Level Security on all tables
ALTER TABLE raw_dbc.spec_set_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_dbc.trait_cond ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_dbc.trait_node_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_dbc.trait_node_group_x_trait_node ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_dbc.trait_node_group_x_trait_cond ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_dbc.trait_node_x_trait_cond ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public (anon) read access
CREATE POLICY "Allow public read access" ON raw_dbc.spec_set_member
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read access" ON raw_dbc.trait_cond
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read access" ON raw_dbc.trait_node_group
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read access" ON raw_dbc.trait_node_group_x_trait_node
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read access" ON raw_dbc.trait_node_group_x_trait_cond
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read access" ON raw_dbc.trait_node_x_trait_cond
    FOR SELECT TO anon USING (true);

-- Grant SELECT to anon role
GRANT SELECT ON raw_dbc.spec_set_member TO anon;
GRANT SELECT ON raw_dbc.trait_cond TO anon;
GRANT SELECT ON raw_dbc.trait_node_group TO anon;
GRANT SELECT ON raw_dbc.trait_node_group_x_trait_node TO anon;
GRANT SELECT ON raw_dbc.trait_node_group_x_trait_cond TO anon;
GRANT SELECT ON raw_dbc.trait_node_x_trait_cond TO anon;

-- Grant full access to service_role for data uploads
GRANT ALL ON raw_dbc.spec_set_member TO service_role;
GRANT ALL ON raw_dbc.trait_cond TO service_role;
GRANT ALL ON raw_dbc.trait_node_group TO service_role;
GRANT ALL ON raw_dbc.trait_node_group_x_trait_node TO service_role;
GRANT ALL ON raw_dbc.trait_node_group_x_trait_cond TO service_role;
GRANT ALL ON raw_dbc.trait_node_x_trait_cond TO service_role;
