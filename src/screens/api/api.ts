// src/screens/api/api.ts

type Json = any;

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
console.log("✅ api.ts loaded, API_BASE_URL =", API_BASE_URL);

function assertApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error(
      "EXPO_PUBLIC_API_URL ist nicht gesetzt. Prüfe .env und starte Expo neu: npx expo start -c"
    );
  }
}

function isAbortError(e: any) {
  const msg = String(e?.message || e);
  return msg.includes("AbortError") || msg.toLowerCase().includes("aborted");
}

async function request(path: string, options: RequestInit = {}) {
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
    // Abort nicht als großer Fehler behandeln (passiert z.B. bei Navigation/Reload)
    if (isAbortError(e)) {
      console.log("⚠️ API aborted:", options.method || "GET", path);
      throw e; // caller entscheidet, ob ignorieren
    }
    console.log("❌ API network/error:", options.method || "GET", path, e);
    throw e;
  }
}

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
