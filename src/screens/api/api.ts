// src/screens/api/api.ts
// Drop-in replacement: Demo-MVP ohne Backend + später Backend wieder aktivierbar

type Json = any;

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");

// Auto-DEMO, wenn keine API URL vorhanden oder explizit demo gesetzt
const MVP_MODE = process.env.EXPO_PUBLIC_MVP_MODE === "demo" || !API_BASE_URL;

function isAbortError(e: any) {
  const msg = String(e?.message || e);
  return msg.includes("AbortError") || msg.toLowerCase().includes("aborted");
}

function assertApiBaseUrl() {
  if (!MVP_MODE && !API_BASE_URL) {
    throw new Error(
      "EXPO_PUBLIC_API_URL ist nicht gesetzt. Prüfe .env und starte Expo neu: npx expo start -c"
    );
  }
}

/* =====================================
   DEMO DATA
===================================== */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DEMO_TEACHERS: any[] = [
  {
    id: "t1",
    authUid: "demo-teacher-1",
    name: "Lisa",
    subject: "Mathe",
    city: "Berlin",
    bio: "Oberstufe & Abi-Vorbereitung. Online/Präsenz.",
    pricePerHour: 25,
    rating: 4.9,
  },
  {
    id: "t2",
    authUid: "demo-teacher-2",
    name: "Max",
    subject: "Englisch",
    city: "Berlin",
    bio: "Konversation + Grammatik. Auch kurzfristig heute.",
    pricePerHour: 22,
    rating: 4.7,
  },
  {
    id: "t3",
    authUid: "demo-teacher-3",
    name: "Sofia",
    subject: "Physik",
    city: "München",
    bio: "Gymnasium 8–13, Prüfungsvorbereitung.",
    pricePerHour: 28,
    rating: 4.8,
  },
];

let DEMO_REQUESTS: any[] = [];
let DEMO_CHATS: any[] = [];
let DEMO_MESSAGES: Record<string, any[]> = {};

function mkId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function makeChatId(studentId: string, teacherId: string) {
  return `c_${String(studentId)}_${String(teacherId)}`;
}

/* =====================================
   REQUEST WRAPPER
===================================== */

async function request(path: string, options: RequestInit = {}) {
  if (MVP_MODE) {
    await wait(250);

    if (path.startsWith("/api/health")) {
      return { status: "ok", mode: "demo" };
    }

    if (path === "/api/teachers" && (!options.method || options.method === "GET")) {
      return DEMO_TEACHERS;
    }

    if (path.startsWith("/api/teachers/by-auth") && (!options.method || options.method === "GET")) {
      const url = new URL(`http://local${path}`);
      const uid = url.searchParams.get("uid");
      return DEMO_TEACHERS.find((t) => String(t.authUid) === String(uid)) ?? null;
    }

    if (path === "/api/teachers" && options.method === "POST") {
      const payload = JSON.parse(String(options.body || "{}"));
      const existingIdx = DEMO_TEACHERS.findIndex((t) => t.authUid === payload.authUid);
      const teacher = {
        id: existingIdx >= 0 ? DEMO_TEACHERS[existingIdx].id : mkId("t"),
        ...DEMO_TEACHERS[existingIdx],
        ...payload,
      };
      if (existingIdx >= 0) DEMO_TEACHERS[existingIdx] = teacher;
      else DEMO_TEACHERS.unshift(teacher);
      return teacher;
    }

    // Requests
    if (path.startsWith("/api/requests") && (!options.method || options.method === "GET")) {
      const url = new URL(`http://local${path}`);
      const teacherId = url.searchParams.get("teacherId");
      const studentId = url.searchParams.get("studentId");

      let filtered = [...DEMO_REQUESTS];
      if (teacherId) filtered = filtered.filter((r) => String(r.teacherId) === String(teacherId));
      if (studentId) filtered = filtered.filter((r) => String(r.studentId) === String(studentId));
      return filtered;
    }

    if (path === "/api/requests" && options.method === "POST") {
      const payload = JSON.parse(String(options.body || "{}"));
      const req = {
        id: mkId("req"),
        status: "pending",
        createdAt: Date.now(),
        ...payload,
      };
      DEMO_REQUESTS.unshift(req);
      return req; // ✅ createRequest erzeugt KEINEN Chat
    }

    if (path.startsWith("/api/requests/") && options.method === "PATCH") {
      const id = path.split("/api/requests/")[1];
      const payload = JSON.parse(String(options.body || "{}"));
      const idx = DEMO_REQUESTS.findIndex((r) => String(r.id) === String(id));
      if (idx >= 0) {
        DEMO_REQUESTS[idx] = { ...DEMO_REQUESTS[idx], ...payload };
        return DEMO_REQUESTS[idx];
      }
      return null;
    }

    // Chats
    if (path === "/api/chats" && options.method === "POST") {
      const payload = JSON.parse(String(options.body || "{}"));

      // ✅ FIX: deterministische Chat-ID, damit kein doppelter Chat entsteht
      const studentId = payload.studentId ?? "";
      const teacherId = payload.teacherId ?? "";
      const deterministicId = payload.id ? String(payload.id) : makeChatId(studentId, teacherId);

      const chat = {
        id: deterministicId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...payload,
        studentId: String(studentId),
        teacherId: String(teacherId),
      };

      // upsert
      const idx = DEMO_CHATS.findIndex((c) => String(c.id) === String(chat.id));
      if (idx >= 0) DEMO_CHATS[idx] = { ...DEMO_CHATS[idx], ...chat };
      else DEMO_CHATS.unshift(chat);

      if (!DEMO_MESSAGES[chat.id]) {
        DEMO_MESSAGES[chat.id] = [
          {
            id: mkId("m"),
            chatId: chat.id,
            senderId: payload.teacherId ?? "t1",
            text: "Hi 🙂 ich kann heute… 17:00–18:00?",
            createdAt: Date.now(),
          },
        ];
      }

      return chat;
    }

    if (path.startsWith("/api/chats") && (!options.method || options.method === "GET")) {
      const url = new URL(`http://local${path}`);
      const userId = url.searchParams.get("userId");

      const chats = userId
        ? DEMO_CHATS.filter(
            (c) => String(c.studentId) === String(userId) || String(c.teacherId) === String(userId)
          )
        : DEMO_CHATS;

      return chats;
    }

    // Messages
    if (path.startsWith("/api/messages") && (!options.method || options.method === "GET")) {
      const url = new URL(`http://local${path}`);
      const chatId = url.searchParams.get("chatId") || "";
      return DEMO_MESSAGES[chatId] ?? [];
    }

    if (path === "/api/messages" && options.method === "POST") {
      const payload = JSON.parse(String(options.body || "{}"));
      const chatId = payload.chatId;

      const msg = {
        id: mkId("m"),
        chatId,
        senderId: payload.senderId,
        text: payload.text,
        createdAt: Date.now(),
      };

      DEMO_MESSAGES[chatId] = [...(DEMO_MESSAGES[chatId] ?? []), msg];

      setTimeout(() => {
        const reply = {
          id: mkId("m"),
          chatId,
          senderId: "t1",
          text: "Perfekt 👍 schick mir kurz das Thema, dann bereite ich was vor.",
          createdAt: Date.now(),
        };
        DEMO_MESSAGES[chatId] = [...(DEMO_MESSAGES[chatId] ?? []), reply];
      }, 1200);

      return msg;
    }

    return null;
  }

  // ---------- REAL API MODE ----------
  assertApiBaseUrl();

  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
    ...(options.headers as any),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const text = await res.text().catch(() => "");

    if (!res.ok) {
      throw new Error(`${res.status} ${text || "Request failed"}`);
    }

    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text as any;
    }
  } catch (e: any) {
    if (isAbortError(e)) throw e;
    throw e;
  }
}

/* =====================================
   EXPORTS
===================================== */

export function getHealth() {
  return request("/api/health");
}

/* ---------------- Teachers ---------------- */
export function getTeachers() {
  return request("/api/teachers");
}

export function getTeacherByAuth(uid: string) {
  return request(`/api/teachers/by-auth?uid=${encodeURIComponent(String(uid))}`);
}

export function upsertTeacher(payload: {
  authUid: string;
  name: string;
  subject?: string | null;
  city?: string | null;
  bio?: string | null;
  pricePerHour?: number | null;
}) {
  return request("/api/teachers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/* ---------------- Requests ---------------- */
export function getRequests(params?: { teacherId?: string; studentId?: string }) {
  const qs = new URLSearchParams();
  if (params?.teacherId) qs.set("teacherId", String(params.teacherId));
  if (params?.studentId) qs.set("studentId", String(params.studentId));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request(`/api/requests${suffix}`);
}

export function createRequest(payload: Json) {
  return request("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function patchRequest(id: string, payload: Json) {
  return request(`/api/requests/${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/* ---------------- Chats ---------------- */
export function createChat(payload: { requestId: string; studentId: string; teacherId: string }) {
  return request("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getChats(userId: string) {
  return request(`/api/chats?userId=${encodeURIComponent(String(userId))}`);
}

/* ---------------- Messages ---------------- */
export function getMessages(chatId: string) {
  return request(`/api/messages?chatId=${encodeURIComponent(String(chatId))}`);
}

export function sendMessage(payload: { chatId: string; senderId: string; text: string }) {
  return request("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
