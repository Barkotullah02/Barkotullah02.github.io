import { requireAdmin } from "./auth.js";
import { renderShell, esc, toast } from "./ui.js";
import { supabase } from "./supabaseClient.js";
import { must } from "./data.js";

const profile = await requireAdmin();
if (profile) init();

async function init() {
  const content = renderShell({ active: "logs.html", profile, title: "Activity Log" });
  content.innerHTML = `
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>When</th><th>Action</th><th>Details</th><th>By</th></tr></thead>
      <tbody id="body"><tr><td colspan="4" class="empty">Loading…</td></tr></tbody>
    </table></div></div>`;

  let rows = [];
  try {
    rows = must(await supabase
      .from("activity_log").select("*").order("created_at", { ascending: false }).limit(300)) || [];
  } catch (e) {
    toast(e.message || "Failed to load activity log", "error");
    document.getElementById("body").innerHTML = `<tr><td colspan="4" class="empty">Could not load the activity log.</td></tr>`;
    return;
  }

  document.getElementById("body").innerHTML = rows.length ? rows.map((r) => `
    <tr>
      <td class="muted mono" style="white-space:nowrap">${new Date(r.created_at).toLocaleString()}</td>
      <td>${actionChip(r.action)}</td>
      <td>${esc(r.message)}</td>
      <td class="muted">${esc(r.actor_name)}</td>
    </tr>`).join("") : `<tr><td colspan="4" class="empty">No activity recorded yet.</td></tr>`;
}

// A dedicated, readable chip per action (not reusing status-badge labels).
function actionChip(a) {
  const map = {
    create: { t: "Create", k: "ok" },
    update: { t: "Update", k: "neutral" },
    stock_in: { t: "Stock in", k: "ok" },
    stock_out: { t: "Stock out", k: "warn" },
    issue: { t: "Issue", k: "warn" },
    return: { t: "Return", k: "ok" },
    create_login: { t: "Create login", k: "ok" },
    delete: { t: "Delete", k: "danger" },
  };
  const m = map[a] || { t: String(a || "").replace(/_/g, " "), k: "neutral" };
  return `<span class="badge ${m.k}"><span class="dot"></span>${esc(m.t)}</span>`;
}
