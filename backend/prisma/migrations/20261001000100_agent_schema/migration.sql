-- =============================================================================
-- Schema for the planning agent (LangGraph checkpoints, PLATFORM.md §4).
-- The agent service creates its own tables inside it at startup; creating the
-- schema here means its database user needs no CREATE-on-database privilege.
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS "agent";
