// js/menu-auth.js
import { Auth } from "../usuarios/auth.js";

// Se estiver dentro de /usuarios/, precisa voltar 1 nível para achar as páginas da raiz
const prefix = window.location.pathname.includes("/usuarios/") ? "../" : "";

// Helper para montar URLs relativas corretas em qualquer página
function href(path) {
  return prefix + path;
}

function ensureLink(nav, id, text, linkHref) {
  let a = nav.querySelector(`#${id}`);
  if (!a) {
    a = document.createElement("a");
    a.id = id;
    nav.appendChild(a);
  }
  a.textContent = text;
  a.href = linkHref;
  return a;
}

function removeLink(nav, id) {
  const el = nav.querySelector(`#${id}`);
  if (el) el.remove();
}

function runMenuAuth() {
  const nav = document.querySelector("header nav");
  if (!nav) return;

  // 1) Corrige SEMPRE os links base do menu (Home/Jogos/Sobre)
  const linkHome = nav.querySelector("#linkHome");
  const linkCatalogo = nav.querySelector("#linkCatalogo");
  const linkSobre = nav.querySelector("#linkSobre");

  if (linkHome) linkHome.href = href("index.html");
  if (linkCatalogo) linkCatalogo.href = href("catalogo.html");
  if (linkSobre) linkSobre.href = href("sobre.html");

  // 2) Controla área de autenticação
  const logged = Auth.isLoggedIn();

  if (!logged) {
    // Deslogado: Entrar + Cadastro
    ensureLink(nav, "authLink", "Entrar", href("usuarios/login.html"));
    ensureLink(nav, "cadastroLink", "Cadastro", href("usuarios/cadastro.html"));

    removeLink(nav, "accountLink");
    removeLink(nav, "logoutLink");
    return;
  }

  // Logado: Minha Conta + Sair
  removeLink(nav, "authLink");
  removeLink(nav, "cadastroLink");

  ensureLink(nav, "accountLink", "Minha Conta", href("usuarios/usuario.html"));

  const logout = ensureLink(nav, "logoutLink", "Sair", "#");
  logout.onclick = (e) => {
    e.preventDefault();
    Auth.logout();
    window.location.href = href("index.html");
  };
}

// Redireciona login/cadastro se já estiver logado (opcional)
(function redirectIfLoggedOnAuthPages() {
  const path = window.location.pathname;
  const isAuthPage =
    path.endsWith("/usuarios/login.html") ||
    path.endsWith("/usuarios/cadastro.html");

  if (isAuthPage && Auth.isLoggedIn()) {
    window.location.href = href("usuarios/usuario.html");
  }
})();

runMenuAuth();
