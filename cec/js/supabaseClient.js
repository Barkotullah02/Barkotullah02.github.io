import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config.js';

// createClient comes from the global `supabase` object set by the UMD
// <script> tag in index.html, loaded before this module — see the comment
// there for why we don't import it as an ES module from the CDN.
const { createClient } = window.supabase;

// persistSession/autoRefreshToken are off on purpose: supabase-js's session
// persistence goes through the browser's Web Locks API, which can deadlock
// silently (no error, just a hung request) on page load in some browsers.
// The tradeoff: admins sign in again each time they open this page, instead
// of staying logged in across reloads — a fine trade for a small internal
// tool, and it avoids an entire class of flaky hangs.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
