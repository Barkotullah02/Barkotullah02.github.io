import { requireAdmin } from "./auth.js";
import { renderShell, esc, badge, toast, openModal, todayLocal } from "./ui.js";
import { icon } from "./icons.js";
import { supabase } from "./supabaseClient.js";
import { logActivity, must } from "./data.js";

const profile = await requireAdmin();
let categories = [];
let rows = [];
let people = [];
let content;
if (profile) init();

async function init() {
  content = renderShell({ active: "products.html", profile, title: "Products" });
  content.innerHTML = `
    <div class="toolbar">
      <div class="search">${icon("search")}<input class="input" id="q" placeholder="Search products…" /></div>
      <select id="cat" style="max-width:200px"><option value="">All categories</option></select>
      <select id="stat" style="max-width:160px">
        <option value="">All statuses</option><option value="LOW STOCK">Low stock</option><option value="OK">OK</option>
      </select>
      <div class="spacer"></div>
      <button class="btn primary" id="addBtn">${icon("plus")} Add product</button>
    </div>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr>
        <th>Product</th><th>Category</th><th class="right">Opening</th><th class="right">In</th>
        <th class="right">Out</th><th class="right">Current</th><th>Status</th><th></th>
      </tr></thead>
      <tbody id="body"></tbody>
    </table></div></div>`;

  document.getElementById("addBtn").addEventListener("click", () => productModal());
  document.getElementById("q").addEventListener("input", render);
  document.getElementById("cat").addEventListener("change", render);
  document.getElementById("stat").addEventListener("change", render);

  try {
    await Promise.all([loadCategories(), loadPeople()]);
    await load();
  } catch (e) {
    toast(e.message || "Failed to load products", "error");
    document.getElementById("body").innerHTML = `<tr><td colspan="8" class="empty">Could not load products.</td></tr>`;
  }
}

async function loadCategories() {
  categories = must(await supabase.from("categories").select("*").order("name")) || [];
  const sel = document.getElementById("cat");
  categories.forEach((c) => { const o = document.createElement("option"); o.value = c.id; o.textContent = c.name; sel.appendChild(o); });
}

async function loadPeople() {
  const data = must(await supabase.from("employees").select("full_name").order("full_name")) || [];
  people = data.map((e) => e.full_name).filter(Boolean);
}

async function load() {
  rows = must(await supabase.from("product_stock").select("*").order("name")) || [];
  render();
}

function render() {
  const q = document.getElementById("q").value.trim().toLowerCase();
  const cat = document.getElementById("cat").value;
  const stat = document.getElementById("stat").value;
  const filtered = rows.filter((r) =>
    (!q || r.name.toLowerCase().includes(q)) &&
    (!cat || String(r.category_id) === cat) &&
    (!stat || r.status === stat));

  const body = document.getElementById("body");
  body.innerHTML = filtered.length ? filtered.map((r) => `
    <tr>
      <td><strong>${esc(r.name)}</strong></td>
      <td class="muted">${esc(r.category_name || "—")}</td>
      <td class="right mono">${r.opening_stock}</td>
      <td class="right mono">${r.total_stock_in}</td>
      <td class="right mono">${r.total_stock_out}</td>
      <td class="right mono"><strong>${r.current_stock}</strong></td>
      <td>${badge(r.status)}</td>
      <td class="right" style="white-space:nowrap">
        <button class="btn sm" data-in="${r.id}">${icon("arrowDown")} In</button>
        <button class="btn sm" data-out="${r.id}">${icon("arrowUp")} Out</button>
        <button class="btn ghost sm" data-edit="${r.id}">${icon("edit")}</button>
      </td>
    </tr>`).join("") : `<tr><td colspan="8" class="empty">No products match.</td></tr>`;

  body.querySelectorAll("[data-in]").forEach((b) => b.addEventListener("click", () => moveModal(+b.dataset.in, "IN")));
  body.querySelectorAll("[data-out]").forEach((b) => b.addEventListener("click", () => moveModal(+b.dataset.out, "OUT")));
  body.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => {
    productModal(rows.find((r) => r.id === +b.dataset.edit));
  }));
}

function catOptions(selected) {
  return categories.map((c) => `<option value="${c.id}" ${String(c.id) === String(selected) ? "selected" : ""}>${esc(c.name)}</option>`).join("");
}

function productModal(existing) {
  const editing = !!existing;
  openModal({
    title: editing ? "Edit product" : "Add product",
    primaryLabel: editing ? "Save changes" : "Add product",
    bodyHTML: `
      <div class="field"><label>Product name</label>
        <input class="input" name="name" required value="${esc(existing?.name || "")}" /></div>
      <div class="field"><label>Category</label>
        <select name="category_id"><option value="">— none —</option>${catOptions(existing?.category_id)}</select></div>
      <div class="row-2">
        <div class="field"><label>Opening stock</label>
          <input class="input" type="number" name="opening_stock" min="0" value="${existing?.opening_stock ?? 0}" /></div>
        <div class="field"><label>Low-stock threshold</label>
          <input class="input" type="number" name="low_stock_threshold" min="0" value="${existing?.low_stock_threshold ?? 5}" /></div>
      </div>`,
    onSubmit: async (f) => {
      const payload = {
        name: f.name.trim(),
        category_id: f.category_id ? +f.category_id : null,
        opening_stock: +f.opening_stock || 0,
        low_stock_threshold: +f.low_stock_threshold || 0,
      };
      if (editing) {
        must(await supabase.from("products").update(payload).eq("id", existing.id));
        await logActivity("update", "product", existing.id, `Updated product "${payload.name}"`);
        toast("Product updated", "success");
      } else {
        const created = must(await supabase.from("products").insert(payload).select().single());
        await logActivity("create", "product", created.id, `Added product "${payload.name}"`);
        toast("Product added", "success");
      }
      await load();
    },
  });
}

function moveModal(productId, type) {
  const p = rows.find((r) => r.id === productId);
  const label = type === "IN" ? "Stock in" : "Stock out";
  openModal({
    title: `${label} — ${p.name}`,
    primaryLabel: label,
    bodyHTML: `
      <p class="muted" style="margin-top:0">Current stock: <strong class="mono">${p.current_stock}</strong></p>
      <div class="field"><label>Quantity</label>
        <input class="input" type="number" name="quantity" min="1" value="1" required /></div>
      <div class="field"><label>Done by</label>
        <input class="input" name="actor_name" list="peopleList" autocomplete="off"
               placeholder="Type or pick a name" value="${esc(profile.full_name || "")}" required />
        <datalist id="peopleList">
          ${people.map((n) => `<option value="${esc(n)}"></option>`).join("")}
        </datalist></div>
      <div class="field"><label>Date</label>
        <input class="input" type="date" name="moved_on" value="${todayLocal()}" /></div>
      <div class="field"><label>Remarks</label>
        <textarea name="remarks" placeholder="Optional note"></textarea></div>`,
    onSubmit: async (f) => {
      const qty = +f.quantity;
      if (!qty || qty < 1) { toast("Enter a valid quantity", "error"); return false; }
      if (type === "OUT" && qty > p.current_stock) { toast("Not enough stock available", "error"); return false; }
      const actor = (f.actor_name || "").trim();
      if (!actor) { toast("Enter who is doing this", "error"); return false; }
      must(await supabase.from("stock_movements").insert({
        product_id: productId, type, quantity: qty, moved_on: f.moved_on || null,
        remarks: f.remarks || null, actor_name: actor,
      }));
      await logActivity(type === "IN" ? "stock_in" : "stock_out", "product", productId,
        `${label} ${qty} × "${p.name}" by ${actor}`);
      toast(`${label} recorded`, "success");
      await load();
    },
  });
}
