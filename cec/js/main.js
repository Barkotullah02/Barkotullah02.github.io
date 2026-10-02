import { getCurrentAdmin, signIn, signOut } from './auth.js';
import { qs, showToast } from './dom.js';
import { initApplicantsView } from './views/applicantsView.js';
import { initFormBuilderView } from './views/formBuilderView.js';
import { initSettingsView } from './views/settingsView.js';

const TABS = {
  applicants: { label: 'Applicants', mount: initApplicantsView, needsAdmin: true },
  builder: { label: 'Form Builder', mount: initFormBuilderView, needsAdmin: false },
  settings: { label: 'Settings', mount: initSettingsView, needsAdmin: false },
};

let activeTab = 'applicants';
let currentAdmin = null;

async function boot() {
  console.log('[main] boot() starting');
  currentAdmin = await getCurrentAdmin();
  console.log('[main] boot() got currentAdmin:', currentAdmin);
  if (currentAdmin) {
    showApp();
  } else {
    showLogin();
  }
}

function showLogin(message) {
  qs('#app-shell').hidden = true;
  qs('#login-screen').hidden = false;
  const errorEl = qs('#login-error');
  errorEl.textContent = message ?? '';
  errorEl.hidden = !message;
}

function showApp() {
  qs('#login-screen').hidden = true;
  qs('#app-shell').hidden = false;
  qs('#admin-name').textContent = currentAdmin.full_name || currentAdmin.email;
  renderTabs();
  mountTab(activeTab);
}

function renderTabs() {
  const nav = qs('#tab-nav');
  nav.innerHTML = '';
  for (const [key, tab] of Object.entries(TABS)) {
    const btn = document.createElement('button');
    btn.className = `tab-nav-item${key === activeTab ? ' is-active' : ''}`;
    btn.textContent = tab.label;
    btn.addEventListener('click', () => {
      activeTab = key;
      renderTabs();
      mountTab(key);
    });
    nav.append(btn);
  }
}

function mountTab(key) {
  const root = qs('#tab-content');
  TABS[key].mount(root, currentAdmin);
}

qs('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = qs('#login-email').value.trim();
  const password = qs('#login-password').value;
  const submitBtn = qs('#login-submit');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in…';
  console.log('[main] login form submitted for', email);

  try {
    await signIn(email, password);
    console.log('[main] signIn() resolved, now resolving admin status…');
    currentAdmin = await getCurrentAdmin();
    console.log('[main] resolved currentAdmin:', currentAdmin);
    if (!currentAdmin) {
      showLogin("Signed in, but this account isn't registered as an admin. Ask an existing admin to add you.");
      await signOut();
      return;
    }
    showApp();
  } catch (err) {
    console.error('[main] login flow threw:', err);
    showLogin(err.message || 'Sign in failed.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign in';
    console.log('[main] login flow finished');
  }
});

qs('#logout-btn').addEventListener('click', async () => {
  await signOut();
  currentAdmin = null;
  activeTab = 'applicants';
  showLogin();
  showToast('Signed out', 'info');
});

boot();
