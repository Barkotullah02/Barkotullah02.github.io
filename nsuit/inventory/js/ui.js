import { icon } from "./icons.js";
import { signOut } from "./auth.js";

// ---- Escaping & formatting -------------------------------------------------
export function esc(v) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d)) return esc(v);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Today's date as YYYY-MM-DD in the viewer's LOCAL timezone (not UTC), so a
// default date never lands on the wrong day for users ahead of UTC.
export function todayLocal() {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d - off).toISOString().slice(0, 10);
}

// ---- Navigation shell (sidebar + topbar) ----------------------------------
const ADMIN_NAV = [
  { href: "dashboard.html",   label: "Dashboard",    icon: "dashboard" },
  { href: "products.html",    label: "Products",     icon: "box" },
  { href: "categories.html",  label: "Categories",   icon: "tag" },
  { href: "assignments.html", label: "Assignments",  icon: "handoff" },
  { href: "employees.html",   label: "Employees",    icon: "users" },
  { href: "logs.html",        label: "Activity Log", icon: "activity" },
];
const EMPLOYEE_NAV = [
  { href: "my-gadgets.html",  label: "My Gadgets",   icon: "package" },
];

// Renders the app shell into <div id="app">, returns the <main> content node.
export function renderShell({ active, profile, title }) {
  const nav = profile.role === "admin" ? ADMIN_NAV : EMPLOYEE_NAV;
  const links = nav.map((n) => `
    <a class="nav-link ${n.href === active ? "active" : ""}" href="${n.href}">
      ${icon(n.icon)}<span>${n.label}</span>
    </a>`).join("");

  const root = document.getElementById("app");
  root.className = "app";
  root.innerHTML = `
    <aside class="sidebar">
      <div class="brand"><span class="mark">${icon("package")}</span> Inventory Beacon</div>
      ${links}
      <div class="nav-spacer"></div>
      <button class="nav-link" id="signOutBtn" style="background:none;border:0;width:100%;cursor:pointer;font:inherit;text-align:left">
        ${icon("logout")}<span>Sign out</span>
      </button>
    </aside>
    <div class="main">
      <div class="topbar">
        <h1>${esc(title)}</h1>
        <div class="who">${esc(profile.full_name || profile.email)} &middot; <span class="faint">${esc(profile.role)}</span></div>
      </div>
      <div class="content" id="content"></div>
    </div>`;

  document.getElementById("signOutBtn").addEventListener("click", signOut);
  return document.getElementById("content");
}

// ---- Toasts ----------------------------------------------------------------
function toastHost() {
  let host = document.querySelector(".toasts");
  if (!host) { host = document.createElement("div"); host.className = "toasts"; document.body.appendChild(host); }
  return host;
}
export function toast(message, kind = "") {
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.textContent = message;
  toastHost().appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 250); }, 3200);
}

// ---- Modal -----------------------------------------------------------------
// openModal({ title, bodyHTML, onOpen, primaryLabel, onSubmit }) -> control
export function openModal({ title, bodyHTML, primaryLabel = "Save", onOpen, onSubmit }) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop open";
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head"><h3>${esc(title)}</h3>
        <button class="btn ghost sm" data-close>${icon("close")}</button></div>
      <form class="modal-body" id="modalForm">${bodyHTML}</form>
      <div class="modal-foot">
        <button type="button" class="btn" data-close>Cancel</button>
        <button type="submit" form="modalForm" class="btn primary" data-submit>${esc(primaryLabel)}</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });

  const form = backdrop.querySelector("#modalForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = backdrop.querySelector("[data-submit]");
    btn.disabled = true;
    try {
      const ok = await onSubmit(Object.fromEntries(new FormData(form)));
      if (ok !== false) close();
    } catch (err) {
      toast(err.message || "Something went wrong", "error");
    } finally {
      btn.disabled = false;
    }
  });

  if (onOpen) onOpen(backdrop);
  return { close, root: backdrop };
}

export function badge(status) {
  const s = String(status || "").toUpperCase();
  if (s === "LOW STOCK") return `<span class="badge warn"><span class="dot"></span>Low stock</span>`;
  if (s === "OK")        return `<span class="badge ok"><span class="dot"></span>OK</span>`;
  if (s === "ISSUED")    return `<span class="badge warn"><span class="dot"></span>Issued</span>`;
  if (s === "RETURNED")  return `<span class="badge ok"><span class="dot"></span>Returned</span>`;
  if (s === "ACTIVE")    return `<span class="badge ok"><span class="dot"></span>Active</span>`;
  if (s === "INACTIVE")  return `<span class="badge neutral"><span class="dot"></span>Inactive</span>`;
  return `<span class="badge neutral">${esc(status)}</span>`;
}
