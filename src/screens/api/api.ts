// src/screens/api/api.ts
const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || ""
).replace(/\/$/, "");

const authUser = process.env.N8N_BASIC_AUTH_USER || "admin";
const authPass = process.env.N8N_BASIC_AUTH_PASSWORD || "";
// btoa Fix für React Native
const authHeader = 'Basic ' + (typeof btoa !== 'undefined' ? btoa(`${authUser}:${authPass}`) : "");

if (!API_BASE_URL) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL fehlt. Starte Expo neu mit: npx expo start -c");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // 🛡️ SICHERHEITS-CHECK: Verhindert doppelte Pfade (wie upsert-teacher/upsert-teacher)
  const cleanBase = API_BASE_URL.replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  // Wenn die Basis-URL schon auf den Endpunkt endet, nicht nochmal anhängen
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
    const res = await fetch(finalUrl, {
      ...options,
      headers,
    });

    const text = await res.text();
    if (!text || text.trim() === "") return {} as T;

    let json: any;
    try { 
      json = JSON.parse(text); 
    } catch { 
      throw new Error(`Server schickte kein JSON: "${text}"`); 
    }

    if (!res.ok) {
      throw new Error(json.error || json.message || `Fehler ${res.status}`);
    }
    return json;
  } catch (error: any) {
    console.error("❌ API FEHLER:", error.message);
    throw error;
  }
}

/**
 * 🔍 NEU: Prüft den Verifizierungs-Status eines Lehrers
 */
export function getTeacherStatus(teacherId: string) {
  return request<{ verified: string }>(`check-teacher-status?teacherId=${teacherId}`, {
    method: "GET"
  });
}

export function getTeachers() {
  return request<any[]>("get-teachers");
}

export function getTeacherRequests(teacherId: string) {
  return request<any[]>(`teacher-requests?teacherId=${teacherId}`);
}

/**
 * ✅ Lehrerprofil inkl. Datei-Upload
 */
export function upsertTeacher(data: any, dokumentUri?: string | null) {
  const formData = new FormData();

  // Text-Daten mitschicken
  Object.keys(data).forEach((key) => {
    formData.append(key, String(data[key]));
  });

  // Datei mitschicken (unter dem Key 'data', den n8n als 'data0' empfängt)
  if (dokumentUri) {
    const filename = dokumentUri.split('/').pop() || 'dokument.pdf';
    const extension = filename.split('.').pop();
    const type = extension === 'pdf' ? 'application/pdf' : 'image/jpeg';

    formData.append("data", {
      uri: dokumentUri,
      name: filename,
      type: type,
    } as any);
  }

  return request("upsert-teacher", {
    method: "POST",
    body: formData,
  });
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