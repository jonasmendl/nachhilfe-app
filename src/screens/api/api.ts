// src/screens/api/api.ts
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const authUser = process.env.N8N_BASIC_AUTH_USER || "admin";
const authPass = process.env.N8N_BASIC_AUTH_PASSWORD || "";
const authHeader = 'Basic ' + btoa(`${authUser}:${authPass}`);

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint}`;
  console.log("API REQUEST:", url);

  try {
    const res = await fetch(url, {
      headers: { 
        "Content-Type": "application/json",
        "Authorization": authHeader,
        ...options.headers 
      },
      ...options,
    });
    const text = await res.text();
    console.log("API RESPONSE:", text);

    if (!text || text.trim() === "") return [] as any;
    const json = JSON.parse(text);
    if (!res.ok) throw new Error(json.error || json.message || `API Error ${res.status}`);
    return json;
  } catch (error: any) {
    console.error("API ERROR:", error.message);
    throw error;
  }
}

// --- API Endpunkte ---

export const getTeachers = () => request<any[]>("get-teachers");

export const likeTeacher = (studentId: string, studentName: string, teacherId: string) => 
  request("like-teacher", {
    method: "POST",
    body: JSON.stringify({ studentId, studentName, teacherId }),
  });

export const getTeacherRequests = (teacherId: string) => 
  request<any[]>(`teacher-requests?teacherId=${teacherId}`);

// WICHTIG: n8n braucht die requestId, um die Zeile im Google Sheet zu finden!
export const setRequestStatus = (requestId: string, status: "accepted" | "declined") => 
  request("accept-request", { // Wir nutzen den accept-request Webhook für beides
    method: "POST",
    body: JSON.stringify({ requestId, status }),
  });

export const getStudentMatches = (studentId: string) => 
  request<any[]>(`student-matches?studentId=${studentId}`);

export const upsertTeacher = (data: any) => 
  request("upsert-teacher", {
    method: "POST",
    body: JSON.stringify(data),
  });