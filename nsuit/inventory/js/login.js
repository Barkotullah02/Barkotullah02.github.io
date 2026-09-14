import { signIn, getProfile } from "./auth.js";
import { icon } from "./icons.js";

document.getElementById("brandMark").innerHTML = icon("package");

// If already signed in, skip the form.
getProfile().then((p) => {
  if (p) window.location.replace(p.role === "admin" ? "dashboard.html" : "my-gadgets.html");
});

const form = document.getElementById("loginForm");
const errEl = document.getElementById("error");
const btn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errEl.textContent = "";
  btn.disabled = true;
  btn.textContent = "Signing in…";
  const email = form.email.value.trim();
  const password = form.password.value;

  const { error } = await signIn(email, password);
  if (error) {
    errEl.textContent = error.message || "Invalid email or password.";
    btn.disabled = false;
    btn.textContent = "Sign in";
    return;
  }
  const profile = await getProfile();
  window.location.replace(profile && profile.role === "admin" ? "dashboard.html" : "my-gadgets.html");
});
