// src/screens/api/api.ts
// Drop-in replacement: Demo-MVP ohne Backend + später Backend wieder aktivierbar

type Json = any;

/*
  ENV (optional):
  EXPO_PUBLIC_MVP_MODE=demo
  EXPO_PUBLIC_API_URL=http://localhost:3000

  WICHTIG:
  - Wenn EXPO_PUBLIC_API_URL NICHT gesetzt ist, läuft automatisch DEMO (kein Crash).
*/

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");

// Auto-DEMO, wenn keine API URL vorhanden oder explizit demo gesetzt
const MVP_MODE =
  process.env.EXPO_PUBLIC_MVP_MODE === "demo" || !API_BASE_URL;

  
console.log("✅ api.ts loaded");
console.log("🧨 DEMO API ACTIVE (api.ts) 🧨", { MVP_MODE, API_BASE_URL });
console.log("MVP_MODE =", MVP_MODE);
console.log("API_BASE_URL =", API_BASE_URL);

function isAbortError(e: any) {
  const msg = String(e?.message || e);
  return msg.includes("AbortError") || msg.toLowerCase().includes("aborted");
}

function assertApiBaseUrl() {
  // In Demo niemals throwen
  if (!MVP_MODE && !API_BASE_URL) {
    throw new Error(
      "EXPO_PUBLIC_API_URL ist nicht gesetzt. Prüfe .env und starte Expo neu: npx expo start -c"
    );
  }
}

/* =====================================
   DEMO DATA (anpassbar)
===================================== */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Teachers: Passe Felder bei Bedarf an dein UI an (id/name/subject/city/bio/pricePerHour...)
const DEMO_TEACHERS: any[] = [
  {
    id: "t1",
    authUid: "demo-teacher-1",
    name: "Lisa K.",
    subject: "Mathe",
    city: "Berlin",
    bio: "Oberstufe & Abi-Vorbereitung. Online/Präsenz.",
    pricePerHour: 25,
    rating: 4.9,
  },
  {
    id: "t2",
    authUid: "demo-teacher-2",
    name: "Max M.",
    subject: "Englisch",
    city: "Berlin",
    bio: "Konversation + Grammatik. Auch kurzfristig heute.",
    pricePerHour: 22,
    rating: 4.7,
  },
  {
    id: "t3",
    authUid: "demo-teacher-3",
    name: "Sofia R.",
    subject: "Physik",
    city: "München",
    bio: "Gymnasium 8–13, Prüfungsvorbereitung.",
    pricePerHour: 28,
    rating: 4.8,
  },
];

// Requests / Chats / Messages: In-Memory Demo-DB
let DEMO_REQUESTS: any[] = [];
let DEMO_CHATS: any[] = [];
let DEMO_MESSAGES: Record<string, any[]> = {};

function mkId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

/* =====================================
   REQUEST WRAPPER
===================================== */

async function request(path: string, options: RequestInit = {}) {
  // ---------- DEMO MODE ----------
  if (MVP_MODE) {
    console.log("🟡 DEMO API:", options.method || "GET", path);
    await wait(450);

    // Health
    if (path.startsWith("/api/health")) {
      return { status: "ok", mode: "demo" };
    }

    // Teachers
    if (path === "/api/teachers" && (!options.method || options.method === "GET")) {
      return DEMO_TEACHERS;
    }

    if (path.startsWith("/api/teachers/by-auth") && (!options.method || options.method === "GET")) {
      const url = new URL(`http://local${path}`);
      const uid = url.searchParams.get("uid");
      // simple demo mapping
      return DEMO_TEACHERS.find((t) => String(t.authUid) === String(uid)) ?? null;
    }

    if (path === "/api/teachers" && options.method === "POST") {
      // upsertTeacher: gib einfach zurück was du bekommst + id
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
        status: "open",
        createdAt: Date.now(),
        ...payload,
      };
      DEMO_REQUESTS.unshift(req);

      // Demo: direkt Chat erzeugen (damit "es funktioniert")
      const teacher = DEMO_TEACHERS[0];
      const chatId = mkId("chat");
      const chat = {
        id: chatId,
        requestId: req.id,
        studentId: payload.studentId ?? "demo-student",
        teacherId: payload.teacherId ?? teacher.id,
        createdAt: Date.now(),
      };
      DEMO_CHATS.unshift(chat);

      DEMO_MESSAGES[chatId] = [
        {
          id: mkId("m"),
          chatId,
          senderId: "teacher",
          text: "Hi 🙂 ich kann heute helfen. Passt 17:00–18:00?",
          createdAt: Date.now(),
        },
      ];

      // Du kannst hier optional das Request "matched" setzen
      req.status = "matched";
      req.chatId = chatId;
      req.teacherId = chat.teacherId;

      return req;
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
      const chat = { id: mkId("chat"), createdAt: Date.now(), ...payload };
      DEMO_CHATS.unshift(chat);

      if (!DEMO_MESSAGES[chat.id]) {
        DEMO_MESSAGES[chat.id] = [
          {
            id: mkId("m"),
            chatId: chat.id,
            senderId: "teacher",
            text: "Hi 🙂 danke für deine Anfrage! Worum geht’s genau?",
            createdAt: Date.now(),
          },
        ];
      }

      return chat;
    }

    if (path.startsWith("/api/chats") && (!options.method || options.method === "GET")) {
      const url = new URL(`http://local${path}`);
      const userId = url.searchParams.get("userId");

      // Wenn du ein bestimmtes Chat-Objektformat brauchst, hier anpassen
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

      // Demo: Teacher antwortet automatisch
      setTimeout(() => {
        const reply = {
          id: mkId("m"),
          chatId,
          senderId: "teacher",
          text: "Perfekt 👍 schick mir kurz das Thema, dann bereite ich was vor.",
          createdAt: Date.now(),
        };
        DEMO_MESSAGES[chatId] = [...(DEMO_MESSAGES[chatId] ?? []), reply];
      }, 1200);

      return msg;
    }

    // Default
    return null;
  }

  // ---------- REAL API MODE ----------
  assertApiBaseUrl();

  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    // ngrok Warnseite überspringen
    "ngrok-skip-browser-warning": "true",
    ...(options.headers as any),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const text = await res.text().catch(() => "");

    console.log("➡️ API", options.method || "GET", path, "STATUS", res.status);

    if (!res.ok) {
      console.log("❌ API ERROR BODY:", text);
      throw new Error(`${res.status} ${text || "Request failed"}`);
    }

    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text as any;
    }
  } catch (e: any) {
    if (isAbortError(e)) {
      console.log("⚠️ API aborted:", options.method || "GET", path);
      throw e;
    }
    console.log("❌ API network/error:", options.method || "GET", path, e);
    throw e;
  }
}

/* =====================================
   EXPORTS (Signaturen wie gehabt)
===================================== */

/* ---------------- Health ---------------- */
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
