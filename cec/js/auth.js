import { supabase } from './supabaseClient.js';

// Resolves the current session's admin row, or null if signed out /
// signed in but not present in the `admins` table (RLS also enforces this
// server-side — this check just drives the UI).
export async function getCurrentAdmin() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) console.error('[auth] getSession() error:', sessionError);

  // Never log the session object itself — it carries a live access_token
  // and refresh_token, usable by anyone who sees the console.
  if (!session) return null;

  const { data, error } = await supabase
    .from('admins')
    .select('id, full_name, email')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('[auth] admins query error:', error);
    return null;
  }
  if (!data) {
    console.warn('[auth] signed in, but no matching row in admins table for this user id — this user is not an admin');
    return null;
  }

  return data;
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('[auth] signInWithPassword error:', error);
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('[auth] signOut error:', error);
}
