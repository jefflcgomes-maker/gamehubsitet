// js/dev-system.js
import { Auth } from "/..usuarios/auth.js";

const DEV_APPS_KEY = "gh_dev_apps_v1";
const GAME_SUBS_KEY = "gh_game_submissions_v1";
const GAMES_PUB_KEY = "gh_games_published_v1";

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return (parsed === null || parsed === undefined) ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function nowISO() {
  return new Date().toISOString();
}

function generateId(prefix) {
  return `${prefix}_` + Math.random().toString(16).slice(2) + "_" + Date.now();
}

function readArray(key) {
  const raw = localStorage.getItem(key);
  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function writeArray(key, arr) {
  localStorage.setItem(key, JSON.stringify(arr));
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export const DevSystem = {
  // ===== DEV APPLICATIONS =====
  getDevApps() {
    return readArray(DEV_APPS_KEY);
  },

  getDevAppById(id) {
    return this.getDevApps().find(a => a.id === id) || null;
  },

  getDevAppByUserId(userId) {
    return this.getDevApps().find(a => a.userId === userId && (a.status === "pending" || a.status === "approved" || a.status === "rejected")) || null;
  },

  submitDevApplication(formData) {
    const user = Auth.getCurrentUser();
    if (!user) return { ok: false, message: "Você precisa estar logado." };

    // cooldown (se rejeitado)
    if (user.devStatus === "rejected" && user.devRejectedUntil) {
      const until = new Date(user.devRejectedUntil);
      if (Date.now() < until.getTime()) {
        return { ok: false, message: "Você foi recusado. Tente novamente após 7 dias." };
      }
    }

    // já pendente/aprovado
    if (user.devStatus === "pending") {
      return { ok: false, message: "Seu pedido já está em análise." };
    }
    if (user.devStatus === "approved" || user.isDev) {
      return { ok: false, message: "Você já é DEV aprovado." };
    }

    const apps = this.getDevApps();
    const app = {
      id: generateId("devapp"),
      userId: user.id,
      nome: user.nome,
      nick: user.nick,
      email: user.email,
      ...formData,
      status: "pending",
      createdAt: nowISO(),
      decidedAt: null,
      decidedBy: "admin",
      rejectReason: null
    };
    apps.push(app);
    writeArray(DEV_APPS_KEY, apps);

    Auth.updateCurrentUser({
      devStatus: "pending",
      devRejectedUntil: null,
      devApplicationId: app.id,
      isDev: false
    });

    return { ok: true, app };
  },

  decideDevApplication(appId, decision, rejectReason = "") {
    const apps = this.getDevApps();
    const idx = apps.findIndex(a => a.id === appId);
    if (idx === -1) return { ok: false, message: "Pedido não encontrado." };

    const app = apps[idx];
    if (app.status !== "pending") {
      return { ok: false, message: "Esse pedido já foi decidido." };
    }

    if (decision === "approve") {
      app.status = "approved";
      app.decidedAt = nowISO();
      apps[idx] = app;
      writeArray(DEV_APPS_KEY, apps);

      // atualiza usuário
      Auth.updateUserById(app.userId, {
        devStatus: "approved",
        isDev: true,
        devRejectedUntil: null,
        devApplicationId: app.id
      });

      return { ok: true };
    }

    if (decision === "reject") {
      app.status = "rejected";
      app.decidedAt = nowISO();
      app.rejectReason = String(rejectReason || "").trim() || "Sem motivo.";
      apps[idx] = app;
      writeArray(DEV_APPS_KEY, apps);

      Auth.updateUserById(app.userId, {
        devStatus: "rejected",
        isDev: false,
        devRejectedUntil: addDaysISO(7),
        devApplicationId: app.id
      });

      return { ok: true };
    }

    return { ok: false, message: "Decisão inválida." };
  },

  // ===== GAME SUBMISSIONS =====
  getSubmissions() {
    return readArray(GAME_SUBS_KEY);
  },

  getSubmissionsByUser(userId) {
    return this.getSubmissions().filter(s => s.userId === userId);
  },

  submitGame(payload) {
    const user = Auth.getCurrentUser();
    if (!user) return { ok: false, message: "Você precisa estar logado." };
    if (!(user.isDev || user.devStatus === "approved")) {
      return { ok: false, message: "Apenas DEV aprovado pode enviar jogos." };
    }

    const title = String(payload?.title || "").trim();
    const description = String(payload?.description || "").trim();
    const downloadUrl = String(payload?.downloadUrl || "").trim();

    if (title.length < 2) return { ok: false, message: "Título inválido." };
    if (description.length < 10) return { ok: false, message: "Descrição muito curta (mín. 10)." };
    if (!downloadUrl) return { ok: false, message: "Coloque um link de download (Drive/Itch/etc.)." };

    const subs = this.getSubmissions();
    const sub = {
      id: generateId("game"),
      userId: user.id,
      devNick: user.nick,
      devEmail: user.email,

      title,
      description,
      category: String(payload?.category || "").trim(),
      tags: String(payload?.tags || "").trim(),
      coverUrl: String(payload?.coverUrl || "").trim(),
      galleryUrls: String(payload?.galleryUrls || "").trim(),
      version: String(payload?.version || "").trim(),
      platform: String(payload?.platform || "").trim(),
      downloadUrl,

      status: "pending", // pending | approved | rejected
      createdAt: nowISO(),
      decidedAt: null,
      rejectReason: null
    };

    subs.push(sub);
    writeArray(GAME_SUBS_KEY, subs);

    return { ok: true, submission: sub };
  },

  decideGame(subId, decision, rejectReason = "") {
    const subs = this.getSubmissions();
    const idx = subs.findIndex(s => s.id === subId);
    if (idx === -1) return { ok: false, message: "Envio não encontrado." };

    const sub = subs[idx];
    if (sub.status !== "pending") {
      return { ok: false, message: "Esse envio já foi decidido." };
    }

    if (decision === "approve") {
      sub.status = "approved";
      sub.decidedAt = nowISO();
      subs[idx] = sub;
      writeArray(GAME_SUBS_KEY, subs);

      // publica
      const pub = readArray(GAMES_PUB_KEY);
      pub.push({
        id: sub.id,
        title: sub.title,
        description: sub.description,
        category: sub.category,
        tags: sub.tags,
        coverUrl: sub.coverUrl,
        downloadUrl: sub.downloadUrl,
        devNick: sub.devNick,
        createdAt: sub.createdAt,
        approvedAt: sub.decidedAt
      });
      writeArray(GAMES_PUB_KEY, pub);

      return { ok: true };
    }

    if (decision === "reject") {
      sub.status = "rejected";
      sub.decidedAt = nowISO();
      sub.rejectReason = String(rejectReason || "").trim() || "Sem motivo.";
      subs[idx] = sub;
      writeArray(GAME_SUBS_KEY, subs);

      return { ok: true };
    }

    return { ok: false, message: "Decisão inválida." };
  },

  getPublishedGames() {
    return readArray(GAMES_PUB_KEY);
  }
};
