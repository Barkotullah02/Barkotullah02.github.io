import { requireAdmin } from "./auth.js";
import { renderShell, esc, badge, fmtDate, toast, openModal, todayLocal } from "./ui.js";
import { icon } from "./icons.js";
import { supabase } from "./supabaseClient.js";
import { logActivity, must } from "./data.js";

const profile = await requireAdmin();
let list = [], products = [], employees = [], content;
if (profile) init();

async function init() {
  content = renderShell({ active: "assignments.html", profile, title: "Assignments" });
  content.innerHTML = `
    <div class="toolbar">
      <div class="search">${icon("search")}<input class="input" id="q" placeholder="Search by person or gadget…" /></div>
      <select id="stat" style="max-width:170px">
        <option value="">All</option><option value="ISSUED">Issued</option><option value="RETURNED">Returned</option>
      </select>
      <div class="spacer"></div>
      <button class="btn primary" id="issueBtn">${icon("handoff")} Issue gadget</button>
    </div>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr>
        <th>Employee</th><th>Gadget</th><th>Brand / spec</th><th class="right">Qty</th>
        <th>Issued</th><th>Issued by</th><th>Status</th><th></th>
      </tr></thead>
      <tbody id="body"></tbody>
    </table></div></div>`;

  document.getElementById("issueBtn").addEventListener("click", issueModal);
  document.getElementById("q").addEventListener("input", render);
  document.getElementById("stat").addEventListener("change", render);
  try {
    await Promise.all([loadRefs(), load()]);
  } catch (e) {
    toast(e.message || "Failed to load assignments", "error");
    document.getElementById("body").innerHTML = `<tr><td colspan="8" class="empty">Could not load assignments.</td></tr>`;
  }
}

async function loadRefs() {
  products = must(await supabase.from("products").select("id, name").order("name")) || [];
  employees = must(await supabase.from("employees").select("id, full_name").eq("status", "active").order("full_name")) || [];
}

async function load() {
  list = must(await supabase
    .from("assignments")
    .select("*, products(name), employees(full_name)")
    .order("date_issued", { ascending: false })) || [];
  render();
}

function render() {
  const q = document.getElementById("q").value.trim().toLowerCase();
  const stat = document.getElementById("stat").value;
  const filtered = list.filter((a) => {
    const person = a.employees?.full_name || "", gadget = a.products?.name || "";
    return (!stat || a.status === stat) &&
      (!q || person.toLowerCase().includes(q) || gadget.toLowerCase().includes(q));
  });
  const body = document.getElementById("body");
  body.innerHTML = filtered.length ? filtered.map((a) => `
    <tr>
      <td><strong>${esc(a.employees?.full_name || "—")}</strong></td>
      <td>${esc(a.products?.name || "—")}</td>
      <td class="muted">${esc([a.brand, a.specification].filter(Boolean).join(" · ") || "—")}</td>
      <td class="right mono">${a.quantity}</td>
      <td>${fmtDate(a.date_issued)}</td>
      <td class="muted">${esc(a.issued_by || "—")}</td>
      <td>${badge(a.status)}</td>
      <td class="right">${a.status === "ISSUED"
        ? `<button class="btn sm" data-return="${a.id}">${icon("check")} Return</button>` : ""}</td>
    </tr>`).join("") : `<tr><td colspan="8" class="empty">No assignments found.</td></tr>`;

  body.querySelectorAll("[data-return]").forEach((b) =>
    b.addEventListener("click", () => returnModal(list.find((a) => a.id === +b.dataset.return))));
}

function issueModal() {
  if (!employees.length) { toast("Add an employee profile first", "error"); return; }
  openModal({
    title: "Issue gadget",
    primaryLabel: "Issue",
    bodyHTML: `
      <div class="field"><label>Employee</label>
        <select name="employee_id" required><option value="">— select —</option>
          ${employees.map((e) => `<option value="${e.id}">${esc(e.full_name)}</option>`).join("")}</select></div>
      <div class="field"><label>Gadget</label>
        <select name="product_id" required><option value="">— select —</option>
          ${products.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></div>
      <div class="row-2">
        <div class="field"><label>Brand</label><input class="input" name="brand" /></div>
        <div class="field"><label>Specification</label><input class="input" name="specification" /></div>
      </div>
      <div class="row-2">
        <div class="field"><label>Quantity</label><input class="input" type="number" name="quantity" min="1" value="1" /></div>
        <div class="field"><label>Date issued</label>
          <input class="input" type="date" name="date_issued" value="${todayLocal()}" /></div>
      </div>
      <div class="row-2">
        <div class="field"><label>Expected return</label><input class="input" type="date" name="expected_return" /></div>
        <div class="field"><label>Issued by</label>
          <input class="input" name="issued_by" value="${esc(profile.full_name || "")}" /></div>
      </div>
      <div class="field"><label>Condition at issue</label><input class="input" name="condition_at_issue" placeholder="e.g. New / Good" /></div>
      <div class="field"><label>Remarks</label><textarea name="remarks"></textarea></div>`,
    onSubmit: async (f) => {
      const qty = +f.quantity || 1;
      const { data: ps } = await supabase
        .from("product_stock").select("current_stock").eq("id", +f.product_id).maybeSingle();
      if (ps && qty > ps.current_stock) {
        toast(`Not enough stock: only ${ps.current_stock} available`, "error");
        return false;
      }
      const created = must(await supabase.from("assignments").insert({
        employee_id: +f.employee_id, product_id: +f.product_id,
        brand: f.brand || null, specification: f.specification || null,
        quantity: +f.quantity || 1, date_issued: f.date_issued || null,
        expected_return: f.expected_return || null, issued_by: f.issued_by || null,
        condition_at_issue: f.condition_at_issue || null, remarks: f.remarks || null,
        status: "ISSUED",
      }).select("*, products(name), employees(full_name)").single());
      await logActivity("issue", "assignment", created.id,
        `Issued "${created.products?.name}" to ${created.employees?.full_name}`);
      toast("Gadget issued", "success");
      await load();
    },
  });
}

function returnModal(a) {
  openModal({
    title: "Mark returned",
    primaryLabel: "Confirm return",
    bodyHTML: `
      <p class="muted" style="margin-top:0">
        Return <strong>${esc(a.products?.name)}</strong> from <strong>${esc(a.employees?.full_name)}</strong>.
        This adds ${a.quantity} back to stock.</p>
      <div class="field"><label>Return date</label>
        <input class="input" type="date" name="returned_on" value="${todayLocal()}" /></div>
      <div class="field"><label>Remarks</label><textarea name="remarks">${esc(a.remarks || "")}</textarea></div>`,
    onSubmit: async (f) => {
      must(await supabase.from("assignments").update({
        status: "RETURNED", returned_on: f.returned_on || null, remarks: f.remarks || null,
      }).eq("id", a.id));
      await logActivity("return", "assignment", a.id,
        `Returned "${a.products?.name}" from ${a.employees?.full_name}`);
      toast("Marked as returned", "success");
      await load();
    },
  });
}
