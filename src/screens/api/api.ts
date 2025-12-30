const API_BASE_URL = "http://192.168.178.47:4000";

export async function getHealth() {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  if (!res.ok) {
    throw new Error("Health check failed");
  }
  return res.json();
}

export async function getRequests() {
  const res = await fetch(`${API_BASE_URL}/api/requests`);
  if (!res.ok) {
    throw new Error("Failed to load requests");
  }
  return res.json();
}
