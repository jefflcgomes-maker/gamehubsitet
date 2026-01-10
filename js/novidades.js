// js/novidades.js
const STORAGE_KEY = "gamehub_novidades_v1";
const MAX_ITEMS = 30;

const cardsEl = document.getElementById("novidadesCards");
const btnLeft = document.getElementById("scrollLeft");
const btnRight = document.getElementById("scrollRight");

/**
 * Descobre a "raiz do site" automaticamente:
 * - Localhost: http://localhost:8000/  -> /
 * - GitHub Pages project site: https://user.github.io/REPO/ -> /REPO/
 *
 * Funciona mesmo sem <script type="module"> usando document.currentScript.src
 */
function getSiteRootUrl() {
  const current = document.currentScript && document.currentScript.src;
  if (!current) return new URL("./", window.location.href); // fallback

  // .../js/novidades.js -> .../js/
  const jsFolder = new URL("./", current);

  // .../js/ -> .../ (raiz do site)
  return new URL("../", jsFolder);
}

const SITE = getSiteRootUrl();

function siteUrl(path = "") {
  const clean = String(path || "").replace(/^\/+/, "");
  return new URL(clean, SITE).href;
}

// Normaliza um link interno (relativo ou "/...") para a raiz do site
function normalizeInternalHref(href) {
  const raw = String(href || "").trim();
  if (!raw) return siteUrl("catalogo.html");

  // Se for link absoluto http(s), mantém
  if (/^https?:\/\//i.test(raw)) return raw;

  // Se começar com "/", vira path relativo ao "site root"
  if (raw.startsWith("/")) return siteUrl(raw.slice(1));

  // Se for relativo, resolve a partir da raiz do site
  return siteUrl(raw);
}

// Normaliza imagem (thumb) com a mesma lógica
function normalizeAssetSrc(src) {
  const raw = String(src || "").trim();
  if (!raw) return siteUrl("assets/img/jogo1.jpg");

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return siteUrl(raw.slice(1));
  return siteUrl(raw);
}

function readList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = JSON.parse(raw || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeList(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function makeCard(game) {
  const title = escapeHtml(game.title || "Jogo");
  const url = normalizeInternalHref(game.url || "catalogo.html");
  const thumb = normalizeAssetSrc(game.thumb || "assets/img/jogo1.jpg");

  return `
    <a class="strip-card" href="${url}">
      <img src="${thumb}" alt="${title}">
      <div class="label">${title}</div>
    </a>
  `;
}

function makePlaceholder() {
  return `
    <div class="strip-card strip-card-placeholder" style="position:relative;">
      <div class="placeholder-center">Em breve</div>
    </div>
  `;
}

function render() {
  if (!cardsEl) return;

  const list = readList();
  if (!list.length) {
    cardsEl.innerHTML = makePlaceholder().repeat(6);
    return;
  }

  cardsEl.innerHTML = list.map(makeCard).join("");
}

function scrollByCards(dir) {
  if (!cardsEl) return;
  const cardWidth = cardsEl.firstElementChild?.getBoundingClientRect?.().width || 260;
  const gap = 14;
  cardsEl.scrollBy({ left: dir * (cardWidth + gap) * 2, behavior: "smooth" });
}

btnLeft?.addEventListener("click", () => scrollByCards(-1));
btnRight?.addEventListener("click", () => scrollByCards(1));

// API pública (para outros scripts adicionarem)
function addNewGame(game) {
  const g = {
    id: game?.id || (crypto?.randomUUID?.() || ("id_" + Date.now())),
    title: String(game?.title || "Novo jogo"),
    url: String(game?.url || "catalogo.html"),
    thumb: String(game?.thumb || "assets/img/jogo1.jpg"),
    createdAt: game?.createdAt || Date.now()
  };

  const list = readList();

  // mantém o mais novo primeiro
  const updated = [g, ...list].slice(0, MAX_ITEMS);

  writeList(updated);
  render();
}

window.GameHubNovidades = { addNewGame };

render();
