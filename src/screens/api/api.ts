const API_BASE_URL = "http://192.168.178.47:3000";

async function handle(res: Response, msg: string) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${msg} (${res.status}) ${text}`);
  }

  // Manche Endpoints könnten mal 204 liefern – safe guard:
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null as any;

  return res.json();
}

/* ---------------- Health ---------------- */

export async function getHealth() {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  return handle(res, "Health check failed");
}

/* ---------------- Teachers ---------------- */

export async function getTeachers() {
  const res = await fetch(`${API_BASE_URL}/api/teachers`);
  return handle(res, "Failed to load teachers");
}

/* ---------------- Requests ---------------- */

export async function getRequests(params?: { teacherId?: string; studentId?: string }) {
  const qs = new URLSearchParams();
  if (params?.teacherId) qs.set("teacherId", params.teacherId);
  if (params?.studentId) qs.set("studentId", params.studentId);

  const url = qs.toString()
    ? `${API_BASE_URL}/api/requests?${qs.toString()}`
    : `${API_BASE_URL}/api/requests`;

  const res = await fetch(url);
  return handle(res, "Failed to load requests");
}

export async function createRequest(payload: any) {
  const res = await fetch(`${API_BASE_URL}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res, "Failed to create request");
}

export async function patchRequest(id: string, payload: any) {
  const res = await fetch(`${API_BASE_URL}/api/requests/${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res, "Failed to patch request");
}

/* ---------------- Chats ---------------- */

export async function createChat(payload: { requestId: string; studentId: string; teacherId: string }) {
  const res = await fetch(`${API_BASE_URL}/api/chats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res, "Failed to create chat");
}

export async function getChats(userId: string) {
  const res = await fetch(
    `${API_BASE_URL}/api/chats?userId=${encodeURIComponent(String(userId))}`
  );
  return handle(res, "Failed to load chats");
}

/* ---------------- Messages ---------------- */

// ✅ GET /api/messages?chatId=...
export async function getMessages(chatId: string) {
  const res = await fetch(
    `${API_BASE_URL}/api/messages?chatId=${encodeURIComponent(String(chatId))}`
  );
  return handle(res, "Failed to load messages");
}

// ✅ POST /api/messages
export async function sendMessage(payload: { chatId: string; senderId: string; text: string }) {
  const res = await fetch(`${API_BASE_URL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res, "Failed to send message");
}
