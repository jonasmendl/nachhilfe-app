// src/screens/api/api.ts
export const API_BASE_URL = "http://192.168.0.191:3000";
console.log("✅ api.ts loaded, API_BASE_URL =", API_BASE_URL);

type Json = any;

/** Fetch mit Timeout, damit "lädt ewig" nicht passiert */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/** Einheitliches Error-Handling */
async function handle(res: Response, msg: string) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${msg} (${res.status}) ${text}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null as any;

  return res.json();
}

/* ---------------- Health ---------------- */

export async function getHealth() {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/health`);
  return handle(res, "Health check failed");
}

/* ---------------- Teachers ---------------- */

export async function getTeachers() {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/teachers`);
  return handle(res, "Failed to load teachers");
}

/* ---------------- Requests ---------------- */

export async function getRequests(params?: {
  teacherId?: string;
  studentId?: string;
  userId?: string; // optional, falls du später /api/requests?userId=... einbaust
}) {
  const qs = new URLSearchParams();

  const teacherId = params?.teacherId ? String(params.teacherId).trim() : "";
  const studentId = params?.studentId ? String(params.studentId).trim() : "";
  const userId = params?.userId ? String(params.userId).trim() : "";

  if (teacherId) qs.set("teacherId", teacherId);
  if (studentId) qs.set("studentId", studentId);
  if (userId) qs.set("userId", userId);

  const url = qs.toString()
    ? `${API_BASE_URL}/api/requests?${qs.toString()}`
    : `${API_BASE_URL}/api/requests`;

  const res = await fetchWithTimeout(url);
  return handle(res, "Failed to load requests");
}

export async function createRequest(payload: Json) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res, "Failed to create request");
}

export async function patchRequest(id: string, payload: Json) {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/requests/${encodeURIComponent(String(id))}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return handle(res, "Failed to patch request");
}

/* ---------------- Chats ---------------- */

export async function createChat(payload: {
  requestId: string;
  studentId: string;
  teacherId: string;
}) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/chats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res, "Failed to create chat");
}

export async function getChats(userId: string) {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/chats?userId=${encodeURIComponent(String(userId).trim())}`
  );
  return handle(res, "Failed to load chats");
}

/* ---------------- Messages ---------------- */

export async function getMessages(chatId: string) {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/messages?chatId=${encodeURIComponent(String(chatId).trim())}`
  );
  return handle(res, "Failed to load messages");
}

export async function sendMessage(payload: { chatId: string; senderId: string; text: string }) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res, "Failed to send message");
}
