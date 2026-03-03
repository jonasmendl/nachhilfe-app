const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || ""
).replace(/\/$/, "");

// Basic Auth Daten aus der .env laden
const authUser = process.env.N8N_BASIC_AUTH_USER || "admin";
const authPass = process.env.N8N_BASIC_AUTH_PASSWORD || "";

// Header für die Authentifizierung erstellen
// btoa konvertiert den String in Base64, was n8n für Basic Auth erwartet
const authHeader = 'Basic ' + btoa(`${authUser}:${authPass}`);

if (!API_BASE_URL) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL fehlt. Starte Expo neu mit: npx expo start -c");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint}`;
  console.log("API REQUEST:", url);

  try {
    const res = await fetch(url, {
      headers: { 
        "Content-Type": "application/json",
        "Authorization": authHeader, // Authentifizierung hinzugefügt
        ...options.headers 
      },
      ...options,
    });

    const text = await res.text();
    console.log("API RESPONSE:", text);

    let json: any;
    try { 
      json = JSON.parse(text); 
    } catch { 
      // Hier fangen wir den Fehler ab, wenn n8n kein JSON schickt
      throw new Error(`Server schickte kein JSON, sondern: "${text}"`); 
    }

    if (!res.ok) {
      throw new Error(json.error || json.message || `API Error ${res.status}`);
    }

    return json;
  } catch (error: any) {
    console.error("API ERROR:", error.message);
    throw error;
  }
}

// --- API Endpunkte ---

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