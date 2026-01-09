// usuarios/auth.js
// DEMO com localStorage (não é seguro para produção)
// Estrutura pronta para trocar por Firebase/PHP depois.

const USERS_KEY = "gh_users_v1";
const SESSION_KEY = "gh_session_v1";
const SAVED_EMAIL_KEY = "gh_saved_email_v1";

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return (parsed === null || parsed === undefined) ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function nowISO() {
  return new Date().toISOString();
}

function generateId(prefix = "u") {
  return `${prefix}_` + Math.random().toString(16).slice(2) + "_" + Date.now();
}

function sanitizeUser(user) {
  if (!user || typeof user !== "object") return null;
  const { senha, ...rest } = user;
  return rest;
}

export const Auth = {
  // ===== Usuários =====
  getUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];

    const parsed = safeJsonParse(raw, []);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(USERS_KEY, JSON.stringify([]));
      return [];
    }
    return parsed;
  },

  saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getUserById(id) {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  },

  findUserByEmail(email) {
    const e = normalizeEmail(email);
    const users = this.getUsers();
    return users.find(u => u.email === e) || null;
  },

  updateUserById(userId, patch) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return { ok: false, message: "Usuário não encontrado." };

    users[idx] = { ...users[idx], ...(patch || {}), updatedAt: nowISO() };
    this.saveUsers(users);
    return { ok: true, user: sanitizeUser(users[idx]) };
  },

  register({ nome, nick, email, senha }) {
    const n = String(nome || "").trim();
    const k = String(nick || "").trim();
    const e = normalizeEmail(email);
    const s = String(senha || "").trim();

    if (n.length < 2) return { ok: false, message: "Nome inválido." };
    if (k.length < 3) return { ok: false, message: "Nick inválido (mín. 3)." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, message: "Email inválido." };
    if (s.length < 4) return { ok: false, message: "Senha inválida (mín. 4)." };

    const users = this.getUsers();
    if (users.some(u => u.email === e)) {
      return { ok: false, message: "Esse email já está cadastrado." };
    }

    const newUser = {
      id: generateId("u"),
      nome: n,
      nick: k,
      email: e,
      senha: s, // DEMO: em produção nunca guardar assim!

      // ===== DEV FLOW (DEMO) =====
      // devStatus: none | pending | approved | rejected
      devStatus: "none",
      devRejectedUntil: null, // ISO date
      devApplicationId: null,
      isDev: false,

      createdAt: nowISO()
    };

    users.push(newUser);
    this.saveUsers(users);

    return { ok: true, user: sanitizeUser(newUser) };
  },

  // ===== Sessão =====
  login(email, senha) {
    const e = normalizeEmail(email);
    const s = String(senha || "").trim();

    const user = this.findUserByEmail(e);
    if (!user || user.senha !== s) {
      return { ok: false, message: "Email ou senha incorretos." };
    }

    const session = {
      userId: user.id,
      email: user.email,
      createdAt: nowISO()
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return { ok: true, user: sanitizeUser(user) };
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
    return { ok: true };
  },

  getSession() {
    return safeJsonParse(localStorage.getItem(SESSION_KEY), null);
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  getCurrentUser() {
    const session = this.getSession();
    if (!session) return null;

    const user = this.getUserById(session.userId);
    return sanitizeUser(user);
  },

  updateCurrentUser(patch) {
    const session = this.getSession();
    if (!session) return { ok: false, message: "Sem sessão." };
    return this.updateUserById(session.userId, patch);
  },

  // ===== Lembrar email =====
  saveEmail(email) {
    localStorage.setItem(SAVED_EMAIL_KEY, normalizeEmail(email));
  },
  getSavedEmail() {
    return localStorage.getItem(SAVED_EMAIL_KEY) || "";
  },
  clearSavedEmail() {
    localStorage.removeItem(SAVED_EMAIL_KEY);
  }
};
