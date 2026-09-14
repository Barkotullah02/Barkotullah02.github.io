import { requireAuth } from "./auth.js";
import { renderShell, esc, badge, fmtDate, toast } from "./ui.js";
import { supabase } from "./supabaseClient.js";
import { must } from "./data.js";

const profile = await requireAuth();
if (profile) init();

async function init() {
  const content = renderShell({ active: "my-gadgets.html", profile, title: "My Gadgets" });

  // RLS returns only this employee's own assignments.
  let rows = [];
  try {
    rows = must(await supabase
      .from("assignments")
      .select("*, products(name)")
      .order("date_issued", { ascending: false })) || [];
  } catch (e) {
    toast(e.message || "Failed to load your gadgets", "error");
    content.innerHTML = `<div class="card card-pad empty">Could not load your gadgets.</div>`;
    return;
  }

  const active = rows.filter((r) => r.status === "ISSUED");

  content.innerHTML = `
    <div class="grid cols-3" style="margin-bottom:16px">
      <div class="card card-pad stat"><span class="label">Currently held</span>
        <span class="value mono">${active.length}</span></div>
      <div class="card card-pad stat"><span class="label">Total ever issued</span>
        <span class="value mono">${rows.length}</span></div>
    </div>
    <div class="card">
      <div class="card-head"><h2>Gadgets assigned to you</h2></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Gadget</th><th>Brand / spec</th><th class="right">Qty</th>
          <th>Issued</th><th>Expected return</th><th>Status</th></tr></thead>
        <tbody>${rows.length ? rows.map((a) => `
          <tr>
            <td><strong>${esc(a.products?.name || "—")}</strong></td>
            <td class="muted">${esc([a.brand, a.specification].filter(Boolean).join(" · ") || "—")}</td>
            <td class="right mono">${a.quantity}</td>
            <td>${fmtDate(a.date_issued)}</td>
            <td>${fmtDate(a.expected_return)}</td>
            <td>${badge(a.status)}</td>
          </tr>`).join("") : `<tr><td colspan="6" class="empty">Nothing is assigned to you yet.</td></tr>`}
        </tbody>
      </table></div>
    </div>`;
}
