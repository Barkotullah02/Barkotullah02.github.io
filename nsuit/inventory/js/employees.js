import { requireAdmin } from "./auth.js";
import { renderShell, esc, badge, toast, openModal } from "./ui.js";
import { icon } from "./icons.js";
import { supabase } from "./supabaseClient.js";
import { logActivity, must } from "./data.js";

const profile = await requireAdmin();
let list = [], content;
if (profile) init();

async function init() {
  content = renderShell({ active: "employees.html", profile, title: "Employees" });
  content.innerHTML = `
    <div class="toolbar">
      <div class="search">${icon("search")}<input class="input" id="q" placeholder="Search employees…" /></div>
      <div class="spacer"></div>
      <button class="btn primary" id="addBtn">${icon("plus")} Add employee</button>
    </div>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr>
        <th>Name</th><th>Code</th><th>Department</th><th>Designation</th>
        <th>Email</th><th>Login</th><th>Status</th><th></th>
      </tr></thead>
      <tbody id="body"></tbody>
    </table></div></div>`;
  document.getElementById("addBtn").addEventListener("click", () => employeeModal());
  document.getElementById("q").addEventListener("input", render);
  try {
    await load();
  } catch (e) {
    toast(e.message || "Failed to load employees", "error");
    document.getElementById("body").innerHTML = `<tr><td colspan="8" class="empty">Could not load employees.</td></tr>`;
  }
}

async function load() {
  list = must(await supabase.from("employees").select("*").order("full_name")) || [];
  render();
}

function render() {
  const q = document.getElementById("q").value.trim().toLowerCase();
  const filtered = list.filter((e) => !q ||
    e.full_name.toLowerCase().includes(q) ||
    (e.email || "").toLowerCase().includes(q) ||
    (e.department || "").toLowerCase().includes(q));
  const body = document.getElementById("body");
  body.innerHTML = filtered.length ? filtered.map((e) => `
    <tr>
      <td><strong>${esc(e.full_name)}</strong></td>
      <td class="muted mono">${esc(e.employee_code || "—")}</td>
      <td>${esc(e.department || "—")}</td>
      <td class="muted">${esc(e.designation || "—")}</td>
      <td class="muted">${esc(e.email || "—")}</td>
      <td>${e.auth_user_id
        ? `<span class="badge ok"><span class="dot"></span>Enabled</span>`
        : `<button class="btn ghost sm" data-login="${e.id}">${icon("lock")} Create login</button>`}</td>
      <td>${badge(e.status)}</td>
      <td class="right"><button class="btn ghost sm" data-edit="${e.id}">${icon("edit")}</button></td>
    </tr>`).join("") : `<tr><td colspan="8" class="empty">No employees yet.</td></tr>`;

  body.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => employeeModal(list.find((e) => e.id === +b.dataset.edit))));
  body.querySelectorAll("[data-login]").forEach((b) =>
    b.addEventListener("click", () => loginModal(list.find((e) => e.id === +b.dataset.login))));
}

function employeeModal(existing) {
  const editing = !!existing;
  openModal({
    title: editing ? "Edit employee" : "Add employee",
    primaryLabel: editing ? "Save changes" : "Add employee",
    bodyHTML: `
      <div class="field"><label>Full name</label>
        <input class="input" name="full_name" required value="${esc(existing?.full_name || "")}" /></div>
      <div class="row-2">
        <div class="field"><label>Employee code</label>
          <input class="input" name="employee_code" value="${esc(existing?.employee_code || "")}" /></div>
        <div class="field"><label>Status</label>
          <select name="status">
            <option value="active" ${existing?.status !== "inactive" ? "selected" : ""}>Active</option>
            <option value="inactive" ${existing?.status === "inactive" ? "selected" : ""}>Inactive</option>
          </select></div>
      </div>
      <div class="row-2">
        <div class="field"><label>Department</label>
          <input class="input" name="department" value="${esc(existing?.department || "")}" /></div>
        <div class="field"><label>Designation</label>
          <input class="input" name="designation" value="${esc(existing?.designation || "")}" /></div>
      </div>
      <div class="row-2">
        <div class="field"><label>Email</label>
          <input class="input" type="email" name="email" value="${esc(existing?.email || "")}" /></div>
        <div class="field"><label>Phone</label>
          <input class="input" name="phone" value="${esc(existing?.phone || "")}" /></div>
      </div>
      <div class="field"><label>Remarks</label><textarea name="remarks">${esc(existing?.remarks || "")}</textarea></div>`,
    onSubmit: async (f) => {
      const payload = {
        full_name: f.full_name.trim(),
        employee_code: f.employee_code || null,
        department: f.department || null,
        designation: f.designation || null,
        email: f.email || null,
        phone: f.phone || null,
        status: f.status || "active",
        remarks: f.remarks || null,
      };
      if (editing) {
        must(await supabase.from("employees").update(payload).eq("id", existing.id));
        await logActivity("update", "employee", existing.id, `Updated employee "${payload.full_name}"`);
        toast("Employee updated", "success");
      } else {
        const created = must(await supabase.from("employees").insert(payload).select().single());
        await logActivity("create", "employee", created.id, `Added employee "${payload.full_name}"`);
        toast("Employee added", "success");
      }
      await load();
    },
  });
}

// Creates a Supabase Auth login for an employee via the admin edge function.
function loginModal(emp) {
  openModal({
    title: `Create login — ${emp.full_name}`,
    primaryLabel: "Create login",
    bodyHTML: `
      <p class="muted" style="margin-top:0">The employee will use this email and a temporary password to sign in and see the gadgets assigned to them.</p>
      <div class="field"><label>Email</label>
        <input class="input" type="email" name="email" required value="${esc(emp.email || "")}" /></div>
      <div class="field"><label>Temporary password</label>
        <input class="input" name="password" required minlength="6" placeholder="At least 6 characters" /></div>`,
    onSubmit: async (f) => {
      const { data, error } = await supabase.functions.invoke("admin-create-employee", {
        body: { employee_id: emp.id, email: f.email.trim(), password: f.password },
      });
      if (error) {
        toast("Login creation needs the edge function deployed (see web/supabase/functions).", "error");
        return false;
      }
      if (data?.error) { toast(data.error, "error"); return false; }
      await logActivity("create_login", "employee", emp.id, `Created login for "${emp.full_name}"`);
      toast("Login created", "success");
      await load();
    },
  });
}
