import { requireAdmin } from "./auth.js";
import { renderShell, esc } from "./ui.js";
import { icon } from "./icons.js";
import { supabase } from "./supabaseClient.js";

const profile = await requireAdmin();
if (profile) init();

async function init() {
  const content = renderShell({ active: "dashboard.html", profile, title: "Dashboard" });

  const [{ data: stock }, { data: assignments }, { data: employees }] = await Promise.all([
    supabase.from("product_stock").select("*"),
    supabase.from("assignments").select("id, status, product_id"),
    supabase.from("employees").select("id"),
  ]);

  const rows = stock || [];
  const totalProducts = rows.length;
  const totalUnits = rows.reduce((s, r) => s + (r.current_stock || 0), 0);
  const lowStock = rows.filter((r) => r.status === "LOW STOCK").length;
  const issued = (assignments || []).filter((a) => a.status === "ISSUED").length;
  const empCount = (employees || []).length;

  const stat = (label, value, sub, ic) => `
    <div class="card card-pad stat">
      <div class="stat-icon">${icon(ic)}</div>
      <span class="label">${label}</span>
      <span class="value mono">${value}</span>
      <span class="sub">${esc(sub)}</span>
    </div>`;

  content.innerHTML = `
    <div class="grid cols-4" style="margin-bottom:16px">
      ${stat("Products", totalProducts, "distinct items tracked", "box")}
      ${stat("Units in stock", totalUnits, "total current quantity", "package")}
      ${stat("Low stock", lowStock, "at or below threshold", "alert")}
      ${stat("Gadgets issued", issued, `${empCount} employee profiles`, "handoff")}
    </div>
    <div class="grid cols-2">
      <div class="card">
        <div class="card-head"><h2>Stock by category</h2></div>
        <div class="card-pad"><canvas id="catChart" height="220"></canvas></div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Most-issued products</h2></div>
        <div class="card-pad"><canvas id="issuedChart" height="220"></canvas></div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card-head"><h2>Low-stock items</h2><a href="products.html" class="btn sm">View products</a></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Product</th><th>Category</th><th class="right">Current</th><th class="right">Threshold</th></tr></thead>
          <tbody id="lowBody"></tbody>
        </table>
      </div>
    </div>`;

  // Low-stock table
  const low = rows.filter((r) => r.status === "LOW STOCK").sort((a, b) => a.current_stock - b.current_stock);
  document.getElementById("lowBody").innerHTML = low.length
    ? low.map((r) => `<tr>
        <td>${esc(r.name)}</td><td class="muted">${esc(r.category_name || "—")}</td>
        <td class="right mono">${r.current_stock}</td><td class="right mono">${r.low_stock_threshold}</td></tr>`).join("")
    : `<tr><td colspan="4" class="empty">No low-stock items. All good.</td></tr>`;

  drawCharts(rows, assignments || []);
}

function drawCharts(rows, assignments) {
  const ink = "#2b2a27", grid = "#e7e4de", accent = "#3f6f6a";
  const palette = ["#3f6f6a", "#7a9b96", "#9a6b1f", "#a13d3d", "#6b6862", "#b7c6c3"];
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  Chart.defaults.color = "#6b6862";

  // Category totals
  const cats = {};
  rows.forEach((r) => { const c = r.category_name || "Uncategorized"; cats[c] = (cats[c] || 0) + (r.current_stock || 0); });
  new Chart(document.getElementById("catChart"), {
    type: "bar",
    data: { labels: Object.keys(cats), datasets: [{ data: Object.values(cats), backgroundColor: accent, borderRadius: 6, maxBarThickness: 48 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: grid } }, x: { grid: { display: false } } } },
  });

  // Most-issued products (by assignment count)
  const byProduct = {};
  assignments.forEach((a) => { byProduct[a.product_id] = (byProduct[a.product_id] || 0) + 1; });
  const nameOf = Object.fromEntries(rows.map((r) => [r.id, r.name]));
  const top = Object.entries(byProduct).map(([pid, n]) => [nameOf[pid] || `#${pid}`, n])
    .sort((a, b) => b[1] - a[1]).slice(0, 6);
  new Chart(document.getElementById("issuedChart"), {
    type: "bar",
    data: { labels: top.map((t) => t[0]), datasets: [{ data: top.map((t) => t[1]), backgroundColor: palette, borderRadius: 6 }] },
    options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { color: grid }, ticks: { precision: 0 } }, y: { grid: { display: false } } } },
  });
}
