// src/screens/api/api.ts
// Clean n8n-only API (kein Demo Mode mehr)

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || ""
).replace(/\/$/, "");

if (!API_BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_BASE_URL fehlt. Prüfe deine .env und starte Expo neu mit: npx expo start -c"
  );
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const json = await res.json();

    if (!res.ok || json.success === false) {
      throw new Error(json.error || "API Error");
    }

    return json.data;
  } catch (error: any) {
    console.error("API ERROR:", error.message);
    throw error;
  }
}

/* =====================================
   MATCH SYSTEM (n8n)
===================================== */

export function likeTeacher(studentId: string, teacherId: string) {
  return request("like-teacher", {
    method: "POST",
    body: JSON.stringify({ studentId, teacherId }),
  });
}

export function getTeacherRequests(teacherId: string) {
  return request(`teacher-requests?teacherId=${teacherId}`);
}

export function acceptRequest(likeId: string) {
  return request("accept-request", {
    method: "POST",
    body: JSON.stringify({ likeId }),
  });
}

export function checkStudentMatches(studentId: string) {
  return request(`student-matches?studentId=${studentId}`);
}
export function upsertTeacher(data: {
  teacherId: string
  name: string
  subject: string
  city: string
  pricePerHour: number
  contact: string
  bio?: string
}) {
  return request("upsert-teacher", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
export function getTeachers() {
  return request("get-teachers");
}