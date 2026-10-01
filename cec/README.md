# NSU CEC — Join Form Admin

A standalone, framework-free (HTML/CSS/JS, ES modules) admin dashboard for the
NSU CEC "Be a Member" join form. Talks directly to Supabase from the browser
using the public anon key — there is no backend/build step, so it can be
hosted anywhere that serves static files, including GitHub Pages.

## Setup

1. Run the migration in `../nsucec-site/supabase/migrations/0001_join_form.sql`
   against your Supabase project (SQL Editor → paste → Run), if you haven't
   already.
2. Bootstrap your own admin login: create a user under
   **Authentication → Users**, copy their UID, then in the SQL Editor:
   ```sql
   insert into admins (id, full_name, email) values ('<uid>', 'Your Name', 'you@example.com');
   ```
3. Edit `js/config.js` and fill in your **Project URL** and **anon public
   key** from Project Settings → API. Never put the `service_role` key here —
   this project is static and its source is fully public.
4. Serve the folder locally to test (opening `index.html` directly via
   `file://` won't work — ES modules require an http server):
   ```bash
   npx serve .
   # or: python3 -m http.server 8080
   ```

## Deploying to GitHub Pages

1. Create a new GitHub repo and push this folder's contents to it.
2. Repo → **Settings → Pages** → Source: deploy from the `main` branch, root.
3. In Supabase, there's nothing else to configure for plain email/password
   sign-in — no redirect URL allowlist is needed since this doesn't use
   magic links or OAuth.

## Structure

```
index.html              Login screen + app shell markup
css/styles.css           All styling
js/config.js             Your Supabase URL + anon key (safe to commit)
js/supabaseClient.js     Supabase client instance
js/auth.js               Sign in/out, current-admin lookup
js/dom.js                Tiny DOM/toast/formatting helpers
js/main.js               Tab router, boots the app
js/views/applicantsView.js   Search/filter applicants, view answers, approve/decline/waiting
js/views/formBuilderView.js  Sections → questions → options CRUD + reordering
js/views/settingsView.js     Form title + open/closed toggle
```
