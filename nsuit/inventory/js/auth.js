import { supabase } from "./supabaseClient.js";

// Returns the current auth session (or null).
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

// Returns { id, role, full_name, employee_id } for the logged-in user, or null.
export async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, employee_id")
    .eq("id", session.user.id)
    .maybeSingle();
  if (error) return null;
  // Fall back to auth email if no profile row / name.
  return data
    ? { ...data, email: session.user.email }
    : { id: session.user.id, role: "employee", full_name: session.user.email, email: session.user.email };
}

// Guard: send to login if not signed in. Returns the profile when allowed.
export async function requireAuth() {
  const profile = await getProfile();
  if (!profile) {
    window.location.replace("index.html");
    return null;
  }
  return profile;
}

// Guard: admin-only pages. Employees are bounced to their gadget view.
export async function requireAdmin() {
  const profile = await requireAuth();
  if (!profile) return null;
  if (profile.role !== "admin") {
    window.location.replace("my-gadgets.html");
    return null;
  }
  return profile;
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.replace("index.html");
}
