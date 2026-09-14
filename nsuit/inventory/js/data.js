import { supabase } from "./supabaseClient.js";

// Write an entry to the activity log. Best-effort — never blocks the UI.
export async function logActivity(action, entity_type, entity_id, message, metadata = null) {
  try {
    await supabase.from("activity_log").insert({ action, entity_type, entity_id, message, metadata });
  } catch (_) { /* logging must never break the action */ }
}

// Throws a readable error if a Supabase call failed.
export function must({ data, error }) {
  if (error) throw new Error(error.message || "Database error");
  return data;
}
