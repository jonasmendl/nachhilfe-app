// src/screens/api/api.ts
const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://n8n-production-87ab.up.railway.app/webhook"
).replace(/\/$/, "");

const authUser = process.env.EXPO_PUBLIC_N8N_BASIC_AUTH_USER || "admin";
const authPass = process.env.EXPO_PUBLIC_N8N_BASIC_AUTH_PASSWORD || "Jalogisch123";

// btoa Fix für React Native
const authHeader = 'Basic ' + (typeof btoa !== 'undefined' ? btoa(`${authUser}:${authPass}`) : "");

if (!API_BASE_URL) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL fehlt. Starte Expo neu mit: npx expo start -c");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanBase = API_BASE_URL.replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const finalUrl = cleanBase.endsWith(endpoint) ? cleanBase : `${cleanBase}${cleanEndpoint}`;
  
  console.log("🚀 API REQUEST:", finalUrl);

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    "Authorization": authHeader,
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(finalUrl, { ...options, headers });
    const text = await res.text();
    if (!text || text.trim() === "") return {} as T;

    let json: any;
    try { json = JSON.parse(text); } catch { throw new Error(`Server schickte kein JSON: "${text}"`); }
    if (!res.ok) throw new Error(json.error || json.message || `Fehler ${res.status}`);
    return json;
  } catch (error: any) {
    console.error("❌ API FEHLER:", error.message);
    throw error;
  }
}

export function getTeacherStatus(teacherId: string) {
  return request<{ verified: string }>(`check-teacher-status?teacherId=${teacherId}`, { method: "GET" });
}

export function getTeachers() {
  return request<any[]>("get-teachers");
}

export function getTeacherRequests(teacherId: string) {
  return request<any[]>(`teacher-requests?teacherId=${teacherId}`);
}

export function upsertTeacher(data: any, dokumentUri?: string | null) {
  const formData = new FormData();
  Object.keys(data).forEach((key) => formData.append(key, String(data[key])));

  if (dokumentUri) {
    const filename = dokumentUri.split('/').pop() || 'dokument.pdf';
    const type = filename.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    formData.append("data", { uri: dokumentUri, name: filename, type: type } as any);
  }
  return request("upsert-teacher", { method: "POST", body: formData });
}

export function likeTeacher(studentId: string, studentName: string, teacherId: string) {
  return request("like-teacher", {
    method: "POST",
    body: JSON.stringify({ studentId, studentName, teacherId }),
  });
}

export function setRequestStatus(requestId: string, status: "accepted" | "declined") {
  return request("accept-request", {
    method: "POST",
    body: JSON.stringify({ requestId, status }),
  });
}

// 🔥 HIER IST DIE FEHLENDE FUNKTION FÜR DEN SCHÜLER:
export function getStudentMatches(studentId: string) {
  return request<any[]>(`student-matches?studentId=${studentId}`, { method: "GET" });
}