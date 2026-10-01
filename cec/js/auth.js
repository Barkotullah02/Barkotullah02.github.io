import { supabase } from './supabaseClient.js';

// Resolves the current session's admin row, or null if signed out /
// signed in but not present in the `admins` table (RLS also enforces this
// server-side — this check just drives the UI).
export async function getCurrentAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('admins')
    .select('id, full_name, email')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function onAuthStateChange(callback) {
  supabase.auth.onAuthStateChange((_event, session) => callback(session));
}
