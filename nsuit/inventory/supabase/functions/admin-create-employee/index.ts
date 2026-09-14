// Supabase Edge Function: admin-create-employee
// Creates a login (auth user) for an existing employee profile.
// Only callable by the admin. Uses the service_role key, which stays server-side
// as a Supabase secret — it is NEVER shipped to the browser.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SCHEMA = "inventory";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    // 1) Verify the CALLER is an admin (runs under their JWT + RLS).
    const asCaller = createClient(url, anonKey, {
      db: { schema: SCHEMA },
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await asCaller.auth.getUser();
    if (!userData?.user) return json({ error: "Not signed in" }, 401);

    const { data: me } = await asCaller
      .from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
    if (!me || me.role !== "admin") return json({ error: "Admin only" }, 403);

    // 2) Validate input.
    const { employee_id, email, password } = await req.json();
    if (!employee_id || !email || !password || String(password).length < 6) {
      return json({ error: "employee_id, email and a 6+ char password are required" }, 400);
    }

    // 3) Create the auth user + link everything (service_role bypasses RLS).
    const admin = createClient(url, serviceKey, { db: { schema: SCHEMA } });

    const { data: emp, error: empErr } = await admin
      .from("employees").select("id, full_name, auth_user_id").eq("id", employee_id).single();
    if (empErr || !emp) return json({ error: "Employee not found" }, 404);
    if (emp.auth_user_id) return json({ error: "This employee already has a login" }, 409);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (createErr) return json({ error: createErr.message }, 400);

    const uid = created.user.id;
    await admin.from("employees").update({ auth_user_id: uid, email }).eq("id", employee_id);
    await admin.from("profiles").upsert({
      id: uid, role: "employee", full_name: emp.full_name, employee_id: employee_id,
    });

    return json({ ok: true, user_id: uid });
  } catch (e) {
    return json({ error: (e as Error).message ?? "Unexpected error" }, 500);
  }
});
