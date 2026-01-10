// js/menu-auth.js
import { Auth } from "../usuarios/auth.js"; // ✅ correto (relativo ao arquivo js/)

function getBasePath() {
  // ✅ Funciona em GitHub Pages (project site) e em localhost
  // Ex: /gamehubsitet/index.html -> base = /gamehubsitet/
  // Ex: /index.html -> base = /
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts.length >= 2 ? `/${parts[0]}/` : "/";
}

const BASE = getBasePath();

function url(path) {
  return BASE + path.replace(/^\/+/, "");
}

function ensureLink(nav, id, text, href) {
  let a = nav.querySelector(`#${id}`);
  if (!a) {
    a = document.createElement("a");
    a.id = id;
    nav.appendChild(a);
  }
  a.textContent = text;
  a.href = href;
  return a;
}

function removeLink(nav, id) {
  const el = nav.querySelector(`#${id}`);
  if (el) el.remove();
}

function removeDevLinks(nav) {
  const links = Array.from(nav.querySelectorAll("a"));
  links.forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    const text = (a.textContent || "").toLowerCase();
    if (href.includes("dev") || text.includes("dev")) {
      if ((a.id || "").toLowerCase() === "accountlink") return;
      if (href.includes("devs") || href.includes("/dev/") || text.includes("dev")) {
        a.remove();
      }
    }
  });
}

function runMenuAuth() {
  const nav = document.querySelector("header nav");
  if (!nav) return;

  removeDevLinks(nav);

  const logged = Auth.isLoggedIn();

  if (!logged) {
    // ✅ Não logado: mostra Entrar + Cadastro
    ensureLink(nav, "authLink", "Entrar", url("usuarios/login.html"));
    ensureLink(nav, "cadastroLink", "Cadastro", url("usuarios/cadastro.html"));

    removeLink(nav, "accountLink");
    removeLink(nav, "logoutLink");
    return;
  }

  // ✅ Logado: mostra Minha Conta + Sair
  removeLink(nav, "authLink");
  removeLink(nav, "cadastroLink");

  ensureLink(nav, "accountLink", "Minha Conta", url("usuarios/usuario.html"));

  const logout = ensureLink(nav, "logoutLink", "Sair", "#");
  logout.onclick = (e) => {
    e.preventDefault();
    Auth.logout();
    window.location.href = url("usuarios/login.html");
  };
}

// Redireciona login/cadastro se já estiver logado (opcional)
(function redirectIfLoggedOnAuthPages() {
  const path = window.location.pathname;
  const isAuthPage =
    path.endsWith("/usuarios/login.html") ||
    path.endsWith("/usuarios/cadastro.html");

  if (isAuthPage && Auth.isLoggedIn()) {
    window.location.href = url("usuarios/usuario.html");
  }
})();

runMenuAuth();
