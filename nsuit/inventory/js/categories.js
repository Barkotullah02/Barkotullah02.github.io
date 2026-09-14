import { requireAdmin } from "./auth.js";
import { renderShell, esc, toast, openModal } from "./ui.js";
import { icon } from "./icons.js";
import { supabase } from "./supabaseClient.js";
import { logActivity, must } from "./data.js";

const profile = await requireAdmin();
let cats = [];      // [{ id, name }]
let counts = {};    // { category_id: number of products }
let content;
if (profile) init();

async function init() {
  content = renderShell({ active: "categories.html", profile, title: "Categories" });
  content.innerHTML = `
    <div class="toolbar">
      <div class="search">${icon("search")}<input class="input" id="q" placeholder="Search categories…" /></div>
      <div class="spacer"></div>
      <button class="btn primary" id="addBtn">${icon("plus")} Add category</button>
    </div>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Category</th><th class="right">Products</th><th></th></tr></thead>
      <tbody id="body"></tbody>
    </table></div></div>`;

  document.getElementById("addBtn").addEventListener("click", () => categoryModal());
  document.getElementById("q").addEventListener("input", render);

  try {
    await load();
  } catch (e) {
    toast(e.message || "Failed to load categories", "error");
    document.getElementById("body").innerHTML = `<tr><td colspan="3" class="empty">Could not load categories.</td></tr>`;
  }
}

async function load() {
  const [c, prods] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("products").select("category_id"),
  ]);
  cats = must(c) || [];
  counts = {};
  (must(prods) || []).forEach((p) => {
    if (p.category_id != null) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
  });
  render();
}

function render() {
  const q = document.getElementById("q").value.trim().toLowerCase();
  const filtered = cats.filter((c) => !q || c.name.toLowerCase().includes(q));
  const body = document.getElementById("body");
  body.innerHTML = filtered.length ? filtered.map((c) => `
    <tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td class="right mono">${counts[c.id] || 0}</td>
      <td class="right" style="white-space:nowrap">
        <button class="btn ghost sm" data-edit="${c.id}">${icon("edit")}</button>
        <button class="btn ghost sm" data-del="${c.id}">${icon("trash")}</button>
      </td>
    </tr>`).join("") : `<tr><td colspan="3" class="empty">No categories yet.</td></tr>`;

  body.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => categoryModal(cats.find((c) => c.id === +b.dataset.edit))));
  body.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => deleteModal(cats.find((c) => c.id === +b.dataset.del))));
}

function categoryModal(existing) {
  const editing = !!existing;
  openModal({
    title: editing ? "Rename category" : "Add category",
    primaryLabel: editing ? "Save changes" : "Add category",
    bodyHTML: `
      <div class="field"><label>Category name</label>
        <input class="input" name="name" required value="${esc(existing?.name || "")}"
               placeholder="e.g. Drives & Storage" /></div>`,
    onSubmit: async (f) => {
      const name = (f.name || "").trim();
      if (!name) { toast("Enter a category name", "error"); return false; }
      if (editing) {
        must(await supabase.from("categories").update({ name }).eq("id", existing.id));
        await logActivity("update", "category", existing.id, `Renamed category to "${name}"`);
        toast("Category updated", "success");
      } else {
        const created = must(await supabase.from("categories").insert({ name }).select().single());
        await logActivity("create", "category", created.id, `Added category "${name}"`);
        toast("Category added", "success");
      }
      await load();
    },
  });
}

function deleteModal(cat) {
  const n = counts[cat.id] || 0;
  openModal({
    title: "Delete category",
    primaryLabel: "Delete category",
    bodyHTML: `
      <p style="margin-top:0">Delete <strong>${esc(cat.name)}</strong>?</p>
      ${n > 0
        ? `<p class="muted">${n} product${n === 1 ? "" : "s"} use this category. They will be kept but become <strong>uncategorized</strong> — you can reassign them later on the Products page.</p>`
        : `<p class="muted">No products use this category.</p>`}`,
    onSubmit: async () => {
      must(await supabase.from("categories").delete().eq("id", cat.id));
      await logActivity("delete", "category", cat.id, `Deleted category "${cat.name}"`);
      toast("Category deleted", "success");
      await load();
    },
  });
}
