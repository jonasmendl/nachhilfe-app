// src/screens/api/api.ts

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || ""
).replace(/\/$/, "");

if (!API_BASE_URL) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL fehlt. Starte Expo neu mit: npx expo start -c");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint}`;
  console.log("API REQUEST:", url);
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    const text = await res.text();
    console.log("API RESPONSE:", text);
    let json: any;
    try { json = JSON.parse(text); } catch { throw new Error("Kein gültiges JSON: " + text); }
    if (!res.ok) throw new Error(json.error || json.message || "API Error " + res.status);
    return json;
  } catch (error: any) {
    console.error("API ERROR:", error.message);
    throw error;
  }
}

export function getTeachers() {
  return request<any[]>("get-teachers");
}

export function likeTeacher(studentId: string, teacherId: string) {
  return request("like-teacher", {
    method: "POST",
    body: JSON.stringify({ studentId, teacherId }),
  });
}

export function getTeacherRequests(teacherId: string) {
  return request<any[]>(`teacher-requests?teacherId=${teacherId}`);
}

export function acceptRequest(likeId: string) {
  return request("accept-request", {
    method: "POST",
    body: JSON.stringify({ likeId }),
  });
}

export function rejectRequest(likeId: string) {
  return request("reject-request", {
    method: "POST",
    body: JSON.stringify({ likeId }),
  });
}

export function getStudentMatches(studentId: string) {
  return request<any[]>(`student-matches?studentId=${studentId}`);
}

export function upsertTeacher(data: {
  teacherId: string;
  name: string;
  subject: string;
  city: string;
  pricePerHour: number;
  contact: string;
  bio?: string;
}) {
  return request("upsert-teacher", {
    method: "POST",
    body: JSON.stringify(data),
  });
}