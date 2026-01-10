// js/menu-auth.js
import { Auth } from "../usuarios/auth.js";

// Raiz do site a partir deste arquivo (/js/menu-auth.js -> /)
const SITE = new URL("../", import.meta.url);

function siteUrl(path = "") {
  const clean = String(path || "").replace(/^\/+/, "");
  return new URL(clean, SITE).href;
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

// Remove links antigos/legados de "devs" do menu, se existirem
function removeDevLinks(nav) {
  const links = Array.from(nav.querySelectorAll("a"));
  links.forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    const text = (a.textContent || "").toLowerCase();

    // não remove "Minha Conta"
    if ((a.id || "").toLowerCase() === "accountlink") return;

    // ✅ cobre: devs.html, /dev/, dev/, qualquer texto "dev"
    if (href.includes("devs") || href.includes("/dev/") || href.includes("dev/") || text.includes("dev")) {
      a.remove();
    }
  });
}

function runMenuAuth() {
  const nav = document.querySelector("header nav");
  if (!nav) return;

  removeDevLinks(nav);

  const logged = Auth.isLoggedIn();

  if (!logged) {
    // Não logado: Entrar + Cadastro
    ensureLink(nav, "authLink", "Entrar", siteUrl("usuarios/login.html"));
    ensureLink(nav, "cadastroLink", "Cadastro", siteUrl("usuarios/cadastro.html"));

    removeLink(nav, "accountLink");
    removeLink(nav, "logoutLink");
    return;
  }

  // Logado: Minha Conta + Sair
  removeLink(nav, "authLink");
  removeLink(nav, "cadastroLink");

  ensureLink(nav, "accountLink", "Minha Conta", siteUrl("usuarios/usuario.html"));

  const logout = ensureLink(nav, "logoutLink", "Sair", "#");
  logout.onclick = (e) => {
    e.preventDefault();
    Auth.logout();
    window.location.href = siteUrl("usuarios/login.html");
  };
}

// Redireciona login/cadastro se já estiver logado (opcional)
(function redirectIfLoggedOnAuthPages() {
  const path = (window.location.pathname || "").toLowerCase();

  // ✅ funciona com /usuarios/login.html e também com usuarios/login.html
  const isAuthPage =
    path.endsWith("/usuarios/login.html") ||
    path.endsWith("usuarios/login.html") ||
    path.endsWith("/usuarios/cadastro.html") ||
    path.endsWith("usuarios/cadastro.html");

  if (isAuthPage && Auth.isLoggedIn()) {
    window.location.href = siteUrl("usuarios/usuario.html");
  }
})();

runMenuAuth();
