// js/access.js
import { Auth } from "../usuarios/auth.js";

const REDIRECT_KEY = "gh_redirect_after_login_v1";
const ADMIN_OK_KEY = "gh_admin_ok_v1";

// ⚠️ DEMO: troque esse token para um seu
const ADMIN_TOKEN = "admin123";

function pathOnly() {
  return window.location.pathname.split("?")[0];
}

function saveRedirect(urlPath) {
  try { localStorage.setItem(REDIRECT_KEY, urlPath); } catch {}
}

export function consumeRedirect() {
  const v = localStorage.getItem(REDIRECT_KEY);
  localStorage.removeItem(REDIRECT_KEY);
  return v;
}

function isDevApproved(user) {
  if (!user) return false;
  return user.isDev === true || user.devStatus === "approved";
}

function isAdmin() {
  return localStorage.getItem(ADMIN_OK_KEY) === "1";
}

function ensureAdmin() {
  if (isAdmin()) return true;

  // permite via ?token=... (DEMO)
  const url = new URL(window.location.href);
  const tok = url.searchParams.get("token");
  if (tok && tok === ADMIN_TOKEN) {
    localStorage.setItem(ADMIN_OK_KEY, "1");
    // limpa token da URL
    url.searchParams.delete("token");
    window.history.replaceState({}, "", url.toString());
    return true;
  }

  const input = prompt("Área restrita (ADMIN). Digite o token:");
  if (input === ADMIN_TOKEN) {
    localStorage.setItem(ADMIN_OK_KEY, "1");
    return true;
  }

  alert("Acesso negado.");
  window.location.href = "/index.html";
  return false;
}

function requireAuthForPages() {
  const p = pathOnly();
  const user = Auth.getCurrentUser();

  // páginas privadas gerais
  const needsLogin = [
    "/usuarios/usuario.html",
    "/usuarios/dev-formulario.html",
    "/dev/painel-dev.html",
    "/admin/aprovar-dev.html",
    "/admin/aprovar-jogos.html",
    "/enviar-jogo.html" // legado (vira dev/painel)
  ];

  if (needsLogin.includes(p) && !Auth.isLoggedIn()) {
    saveRedirect(p);
    window.location.href = "/usuarios/login.html";
    return;
  }

  // Admin pages
  if (p.startsWith("/admin/")) {
    ensureAdmin();
    return;
  }

  // Dev-only pages
  if (p.startsWith("/dev/") || p === "/enviar-jogo.html") {
    if (!isDevApproved(user)) {
      alert("Você ainda não é DEV aprovado. Solicite no seu perfil.");
      window.location.href = "/usuarios/usuario.html";
      return;
    }
  }

  // Legado: devs.html vira apenas informativo (opcional)
}

function gateInteractions() {
  // Qualquer elemento com data-auth="required" exige login
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-auth='required']");
    if (!el) return;

    if (Auth.isLoggedIn()) return;

    e.preventDefault();
    const reason = el.getAttribute("data-auth-reason") || "Faça login para continuar.";
    alert(reason);

    const href = el.getAttribute("href");
    saveRedirect(href || window.location.pathname);

    window.location.href = "/usuarios/login.html";
  });

  // data-dev="required" exige DEV aprovado
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-dev='required']");
    if (!el) return;

    const user = Auth.getCurrentUser();
    if (isDevApproved(user)) return;

    e.preventDefault();
    alert("Acesso somente para DEV aprovado.");
    window.location.href = "/usuarios/usuario.html";
  });
}

requireAuthForPages();
gateInteractions();
