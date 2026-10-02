import { supabase } from './supabaseClient.js';

// Resolves the current session's admin row, or null if signed out /
// signed in but not present in the `admins` table (RLS also enforces this
// server-side — this check just drives the UI).
export async function getCurrentAdmin() {
  console.log('[auth] getCurrentAdmin: calling getSession()…');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) console.error('[auth] getSession() error:', sessionError);
  console.log('[auth] getSession() resolved, session:', session);

  if (!session) {
    console.log('[auth] no session — not signed in');
    return null;
  }

  console.log('[auth] querying admins table for user id', session.user.id);
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

  console.log('[auth] admin row found:', data);
  return data;
}

export async function signIn(email, password) {
  console.log('[auth] signIn: calling signInWithPassword for', email);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('[auth] signInWithPassword error:', error);
    throw error;
  }
  console.log('[auth] signInWithPassword succeeded, user id:', data.user?.id);
}

export async function signOut() {
  console.log('[auth] signOut');
  const { error } = await supabase.auth.signOut();
  if (error) console.error('[auth] signOut error:', error);
}
