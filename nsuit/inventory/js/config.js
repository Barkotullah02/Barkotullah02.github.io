// Supabase connection — both values below are PUBLIC and safe to commit.
// The anon key only works within the limits of your Row-Level Security policies.
// NEVER put the service_role key in this file or anywhere in web/.
export const SUPABASE_URL = "https://wggpqcjbghonuaxqjvzw.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ3BxY2piZ2hvbnVheHFqdnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDgwOTgsImV4cCI6MjA5NjEyNDA5OH0.RJ0fs0Q136kgyPpyj3BqnrIeFSAPlL-40pVN7hj_hW4";

// This app lives entirely in its own Postgres schema, isolated from any other
// project in the same database. Every query is scoped here.
export const DB_SCHEMA = "inventory";
