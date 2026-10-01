// Safe to commit: the anon key is meant to be public — every request it makes
// is still checked against Supabase Row Level Security on the server side.
// NEVER put the service_role key in this project. This site is static and
// anyone can view its source.
export const SUPABASE_URL = 'https://hpwbjajagozsmvosknvz.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwd2JqYWphZ296c212b3NrbnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NDU3ODYsImV4cCI6MjEwNjMyMTc4Nn0._4LlNc-nanMk9OhoB2nmczPW1TMpm2hW3c4AvN4dbZk';
