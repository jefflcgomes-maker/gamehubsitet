// js/menu-auth.js
import { Auth } from "/usuarios/auth.js";

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
  // Remove/hide qualquer link "Para Devs" que ainda exista em páginas antigas
  const links = Array.from(nav.querySelectorAll("a"));
  links.forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    const text = (a.textContent || "").toLowerCase();
    if (href.includes("dev") || text.includes("dev")) {
      // Mantém "Minha Conta" se existir
      if ((a.id || "").toLowerCase() === "accountlink") return;
      // Mantém caso seja a home/jogos/sobre (não contém dev)
      // Remove qualquer coisa relacionada a dev
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
    // Não logado: mostra "Entrar"
    ensureLink(nav, "authLink", "Entrar", "/usuarios/login.html");
    removeLink(nav, "accountLink");
    removeLink(nav, "logoutLink");
    return;
  }

  // Logado: mostra "Minha Conta" + "Sair"
  removeLink(nav, "authLink");
  ensureLink(nav, "accountLink", "Minha Conta", "/usuarios/usuario.html");

  const logout = ensureLink(nav, "logoutLink", "Sair", "#");
  logout.onclick = (e) => {
    e.preventDefault();
    Auth.logout();
    window.location.href = "/usuarios/login.html";
  };
}

// Redireciona login/cadastro se já estiver logado (opcional)
(function redirectIfLoggedOnAuthPages() {
  const path = window.location.pathname;
  const isAuthPage =
    path.endsWith("/usuarios/login.html") ||
    path.endsWith("/usuarios/cadastro.html");

  if (isAuthPage && Auth.isLoggedIn()) {
    window.location.href = "/usuarios/usuario.html";
  }
})();

runMenuAuth();
