# Edge Function: admin-create-employee

Creates a login for an employee. This is the ONLY place the `service_role` key is
used, and it lives only as a Supabase secret — never in the browser or in git.

You only need this when you want employees to log in and see their own gadgets.
Everything else in the app works without it.

## Deploy (Supabase CLI — recommended)

```bash
# one-time
npm install -g supabase
supabase login
supabase link --project-ref wggpqcjbghonuaxqjvzw

# set the secret (paste your service_role key here, in the terminal only)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# deploy (run from the web/supabase folder)
supabase functions deploy admin-create-employee
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided to functions automatically.

## Deploy (Dashboard — no CLI)

1. Supabase → **Edge Functions** → **Create a function** → name it exactly
   `admin-create-employee`.
2. Paste the contents of `admin-create-employee/index.ts`.
3. Supabase → **Edge Functions → Secrets** (or Project Settings → Edge Functions):
   add `SUPABASE_SERVICE_ROLE_KEY` = your service_role key. Save.
4. Deploy.

## Test
In the app: **Employees → Create login** on any employee row.
