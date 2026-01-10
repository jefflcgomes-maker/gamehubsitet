// js/access.js
import { Auth } from "../usuarios/auth.js";

const REDIRECT_KEY = "gh_redirect_after_login_v1";
const ADMIN_OK_KEY = "gh_admin_ok_v1";

// ⚠️ DEMO: troque esse token para um seu
const ADMIN_TOKEN = "admin123";

// Raiz do site a partir deste arquivo (/js/access.js -> /)
const SITE = new URL("../", import.meta.url);
const SITE_PATH = SITE.pathname.endsWith("/") ? SITE.pathname : SITE.pathname + "/";

function siteUrl(path = "") {
  const clean = String(path || "").replace(/^\/+/, "");
  return new URL(clean, SITE).href;
}

// Converte a URL atual para caminho relativo ao "site root" (com /...)
// Ex GitHub Pages: /gamehubsitet/usuarios/login.html -> /usuarios/login.html
function sitePathOnly() {
  const p = window.location.pathname.split("?")[0];
  if (SITE_PATH === "/") return p; // já está no root
  return p.startsWith(SITE_PATH) ? "/" + p.slice(SITE_PATH.length) : p;
}

// Normaliza qualquer href (relativo/absoluto) para "/..."
// e também remove prefixo do repo no GitHub Pages
// ✅ mantém querystring (ex: ?cat=rpg)
function normalizeToSitePath(href) {
  try {
    const u = new URL(href, window.location.href);
    let p = u.pathname;

    if (SITE_PATH !== "/" && p.startsWith(SITE_PATH)) {
      p = "/" + p.slice(SITE_PATH.length);
    }

    const q = u.search || "";
    return p + q;
  } catch {
    // fallback: caminho atual
    const base = sitePathOnly();
    const q = window.location.search || "";
    return base + q;
  }
}

function saveRedirect(urlPathOrHref) {
  try {
    const p = normalizeToSitePath(urlPathOrHref);
    localStorage.setItem(REDIRECT_KEY, p);
  } catch {}
}

// ✅ agora sempre devolve uma URL "correta" para o site atual (GitHub Pages / localhost / domínio)
export function consumeRedirect() {
  const v = localStorage.getItem(REDIRECT_KEY);
  localStorage.removeItem(REDIRECT_KEY);
  if (!v) return null;

  // v pode ser "/usuarios/usuario.html?x=1" -> precisamos virar URL do site correto
  return siteUrl(v.replace(/^\/+/, ""));
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
  window.location.href = siteUrl("index.html");
  return false;
}

// ✅ Corrige caminhos absolutos do HTML que começam com "/" (quebram no GitHub Pages project site)
function fixAbsoluteInternalLinks() {
  // a[href^="/"]
  document.querySelectorAll("a[href^='/']").forEach((el) => {
    const raw = el.getAttribute("href");
    if (!raw) return;
    if (raw.startsWith("//")) return; // não mexe em protocol-relative
    el.setAttribute("href", siteUrl(raw.slice(1)));
  });

  // form[action^="/"]
  document.querySelectorAll("form[action^='/']").forEach((el) => {
    const raw = el.getAttribute("action");
    if (!raw) return;
    if (raw.startsWith("//")) return;
    el.setAttribute("action", siteUrl(raw.slice(1)));
  });

  // script[src^="/"], link[href^="/"], img[src^="/"]
  document.querySelectorAll("script[src^='/'], link[href^='/'], img[src^='/']").forEach((el) => {
    const attr = el.tagName.toLowerCase() === "link" ? "href" : "src";
    const raw = el.getAttribute(attr);
    if (!raw) return;
    if (raw.startsWith("//")) return;
    el.setAttribute(attr, siteUrl(raw.slice(1)));
  });
}

function requireAuthForPages() {
  const p = sitePathOnly();
  const user = Auth.getCurrentUser();

  const needsLogin = [
    "/usuarios/usuario.html",
    "/usuarios/dev-formulario.html",
    "/dev/painel-dev.html",
    "/admin/aprovar-dev.html",
    "/admin/aprovar-jogos.html",
    "/enviar-jogo.html"
  ];

  if (needsLogin.includes(p) && !Auth.isLoggedIn()) {
    saveRedirect(p);
    window.location.href = siteUrl("usuarios/login.html");
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
      window.location.href = siteUrl("usuarios/usuario.html");
      return;
    }
  }
}

function gateInteractions() {
  // data-auth="required" exige login
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-auth='required']");
    if (!el) return;

    if (Auth.isLoggedIn()) return;

    e.preventDefault();
    const reason = el.getAttribute("data-auth-reason") || "Faça login para continuar.";
    alert(reason);

    const href = el.getAttribute("href");
    saveRedirect(href || (sitePathOnly() + (window.location.search || "")));

    window.location.href = siteUrl("usuarios/login.html");
  });

  // data-dev="required" exige DEV aprovado
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-dev='required']");
    if (!el) return;

    const user = Auth.getCurrentUser();
    if (isDevApproved(user)) return;

    e.preventDefault();
    alert("Acesso somente para DEV aprovado.");
    window.location.href = siteUrl("usuarios/usuario.html");
  });
}

fixAbsoluteInternalLinks();
requireAuthForPages();
gateInteractions();
