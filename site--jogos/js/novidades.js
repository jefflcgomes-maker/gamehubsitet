// novidades.js
// Galeria "NOVIDADES" com limite de 30.
// Novo jogo entra no começo; se passar de 30, remove o mais antigo.

const STORAGE_KEY = "gamehub_novidades_v1";
const MAX_CARDS = 30;

const cardsEl = document.getElementById("novidadesCards");
const btnLeft = document.getElementById("scrollLeft");
const btnRight = document.getElementById("scrollRight");

// ---------- Helpers ----------
function loadNovidades() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveNovidades(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function normalizeGame(game) {
  // game: { title, url, thumb, createdAt }
  return {
    id: game.id || crypto.randomUUID(),
    title: String(game.title || "Novo Jogo"),
    url: String(game.url || "jogo.html"),
    thumb: String(game.thumb || "assets/img/placeholder.jpg"),
    createdAt: game.createdAt || Date.now()
  };
}

// ---------- Render ----------
function render(list) {
  if (!cardsEl) return; // segurança se o elemento não existir

  cardsEl.innerHTML = "";

// Se não tiver jogos, mostra cards placeholder (com barra embaixo)
if (!list.length) {
  for (let i = 0; i < 8; i++) {
    const a = document.createElement("a");
    a.className = "strip-card strip-card-placeholder";
    a.href = "#";

    a.innerHTML = `
      <div class="placeholder-center">Em breve</div>
      <div class="placeholder-footer"></div>
    `;

    cardsEl.appendChild(a);
  }
  return;
}


  // Se tiver jogos, renderiza os cards reais
  for (const game of list) {
    const a = document.createElement("a");
    a.className = "strip-card";
    a.href = game.url;

    a.innerHTML = `
      <img src="${game.thumb}" alt="${escapeHtml(game.title)}">
      <div class="label">${escapeHtml(game.title)}</div>
    `;

    cardsEl.appendChild(a);
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

// ---------- Core: add new game ----------
function addNewGame(game) {
  const list = loadNovidades();
  const g = normalizeGame(game);

  // Novo jogo entra no começo
  const updated = [g, ...list];

  // Limita a 30 (remove o mais antigo no fim)
  if (updated.length > MAX_CARDS) updated.length = MAX_CARDS;

  saveNovidades(updated);
  render(updated);

  // rola para o começo pra ver o novo
  cardsEl?.scrollTo({ left: 0, behavior: "smooth" });
}

// ---------- Scroll buttons ----------
btnLeft?.addEventListener("click", () => {
  cardsEl?.scrollBy({ left: -520, behavior: "smooth" });
});

btnRight?.addEventListener("click", () => {
  cardsEl?.scrollBy({ left: 520, behavior: "smooth" });
});

// ---------- Init ----------
render(loadNovidades());

// Export: permite adicionar jogo novo a partir de outras páginas/scripts
window.GameHubNovidades = { addNewGame };
