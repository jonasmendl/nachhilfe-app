import http from "http";
import "dotenv/config";
import dns from "dns";
import { createClient } from "@supabase/supabase-js";

dns.setDefaultResultOrder("ipv4first");

const PORT = process.env.PORT || 4000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("ENV check:", {
  hasUrl: !!process.env.SUPABASE_URL,
  url: process.env.SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  port: process.env.PORT,
});
console.log("SERVER VERSION: full-api-2-auth-uid");

/* ---------------- CORS ---------------- */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/* ---------------- Helpers ---------------- */

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    ...corsHeaders,
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({ __invalidJson: true });
      }
    });
  });
}

function isInvalidJson(body) {
  return body && body.__invalidJson;
}

/* ---------------- Server ---------------- */

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  const parsedUrl = new URL(url, `http://${req.headers.host}`);

  // Preflight
  if (method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  /* -------- Health -------- */

  if (method === "GET" && parsedUrl.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, time: new Date().toISOString() });
    return;
  }

  /* ---------------- Teachers ---------------- */

  // GET /api/teachers
  if (method === "GET" && parsedUrl.pathname === "/api/teachers") {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) return sendJson(res, 500, { ok: false, error: error.message });
      return sendJson(res, 200, data || []);
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: String(e) });
    }
  }

  // ✅ NEW: GET /api/teachers/by-auth?uid=...
  if (method === "GET" && parsedUrl.pathname === "/api/teachers/by-auth") {
    const uid = parsedUrl.searchParams.get("uid");
    if (!uid) return sendJson(res, 400, { ok: false, message: "uid erforderlich" });

    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("auth_uid", String(uid))
        .maybeSingle();

      if (error) return sendJson(res, 500, { ok: false, error: error.message });
      if (!data) return sendJson(res, 404, { ok: false, message: "teacher nicht gefunden" });

      return sendJson(res, 200, data);
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: String(e) });
    }
  }

  // ✅ UPDATED: POST /api/teachers (upsert by auth_uid)
  if (method === "POST" && parsedUrl.pathname === "/api/teachers") {
    const body = await parseBody(req);
    if (isInvalidJson(body)) return sendJson(res, 400, { ok: false, message: "Ungültiges JSON" });

    const {
      authUid,
      name,
      subject,
      city,
      bio,
      pricePerHour,
    } = body;

    if (!authUid || !name) {
      return sendJson(res, 400, { ok: false, message: "authUid und name sind erforderlich" });
    }

    try {
      // Upsert über auth_uid (unique index nötig/empfohlen)
      const { data, error } = await supabase
        .from("teachers")
        .upsert(
          {
            auth_uid: String(authUid),
            name: String(name),
            subject: subject ?? null,
            city: city ?? null,
            bio: bio ?? null,
            pricePerHour: pricePerHour ?? null,
          },
          { onConflict: "auth_uid" }
        )
        .select()
        .single();

      if (error) return sendJson(res, 500, { ok: false, error: error.message });
      return sendJson(res, 201, data);
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: String(e) });
    }
  }

  /* ---------------- Requests ---------------- */

  // GET /api/requests?teacherId=...&studentId=...
  if (method === "GET" && parsedUrl.pathname === "/api/requests") {
    const teacherId = parsedUrl.searchParams.get("teacherId");
    const studentId = parsedUrl.searchParams.get("studentId");

    try {
      let q = supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (teacherId) q = q.eq("teacher_id", teacherId);
      if (studentId) q = q.eq("student_id", studentId);

      const { data, error } = await q;
      if (error) return sendJson(res, 500, { ok: false, error: error.message });

      return sendJson(res, 200, data || []);
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: String(e) });
    }
  }

  // POST /api/requests
  if (method === "POST" && parsedUrl.pathname === "/api/requests") {
    const body = await parseBody(req);
    if (isInvalidJson(body)) return sendJson(res, 400, { ok: false, message: "Ungültiges JSON" });

    const { studentId, studentName, teacherId, teacherName, subject, city, when } = body;

    if (!studentId || !studentName || !teacherId || !teacherName) {
      return sendJson(res, 400, {
        ok: false,
        message: "studentId, studentName, teacherId, teacherName sind erforderlich",
      });
    }

    try {
      const { data, error } = await supabase
        .from("requests")
        .insert({
          student_id: String(studentId),
          student_name: String(studentName),
          teacher_id: String(teacherId),
          teacher_name: String(teacherName),
          subject: subject ?? null,
          city: city ?? null,
          when: when ?? null,
          status: "pending",
        })
        .select()
        .single();

      if (error) return sendJson(res, 500, { ok: false, error: error.message });
      return sendJson(res, 201, data);
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: String(e) });
    }
  }

  // PATCH /api/requests/:id
  if (method === "PATCH" && parsedUrl.pathname.startsWith("/api/requests/")) {
    const id = parsedUrl.pathname.split("/").pop();
    const body = await parseBody(req);

    if (isInvalidJson(body)) return sendJson(res, 400, { ok: false, message: "Ungültiges JSON" });

    const { status } = body;
    const allowed = ["pending", "accepted", "rejected"];
    if (!allowed.includes(status)) {
      return sendJson(res, 400, { ok: false, message: "status muss pending|accepted|rejected sein" });
    }

    try {
      const { data, error } = await supabase
        .from("requests")
        .update({ status })
        .eq("id", String(id))
        .select()
        .single();

      if (error) return sendJson(res, 500, { ok: false, error: error.message });
      return sendJson(res, 200, data);
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: String(e) });
    }
  }

  /* ---------------- Chats ---------------- */

  // POST /api/chats { requestId, studentId, teacherId }
  if (method === "POST" && parsedUrl.pathname === "/api/chats") {
    const body = await parseBody(req);
    if (isInvalidJson(body)) return sendJson(res, 400, { ok: false, message: "Ungültiges JSON" });

    const { requestId, studentId, teacherId } = body;
    if (!requestId || !studentId || !teacherId) {
      return sendJson(res, 400, { ok: false, message: "requestId, studentId, teacherId erforderlich" });
    }

    try {
      const existing = await supabase
        .from("chats")
        .select("*")
        .eq("request_id", String(requestId))
        .maybeSingle();

      if (existing.error) return sendJson(res, 500, { ok: false, error: existing.error.message });

      if (existing.data) return sendJson(res, 200, existing.data);

      const created = await supabase
        .from("chats")
        .insert({
          request_id: String(requestId),
          student_id: String(studentId),
          teacher_id: String(teacherId),
        })
        .select()
        .single();

      if (created.error) return sendJson(res, 500, { ok: false, error: created.error.message });

      return sendJson(res, 201, created.data);
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: String(e) });
    }
  }

  // GET /api/chats?userId=...
  if (method === "GET" && parsedUrl.pathname === "/api/chats") {
    const userId = parsedUrl.searchParams.get("userId");
    if (!userId) return sendJson(res, 400, { ok: false, message: "userId erforderlich" });

    try {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(`student_id.eq.${userId},teacher_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) return sendJson(res, 500, { ok: false, error: error.message });
      return sendJson(res, 200, data || []);
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: String(e) });
    }
  }

  /* ---------------- Messages ---------------- */

  // GET /api/messages?chatId=...
  if (method === "GET" && parsedUrl.pathname === "/api/messages") {
    const chatId = parsedUrl.searchParams.get("chatId");
    if (!chatId) return sendJson(res, 400, { ok: false, message: "chatId erforderlich" });

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", String(chatId))
        .order("created_at", { ascending: true });

      if (error) return sendJson(res, 500, { ok: false, error: error.message });
      return sendJson(res, 200, data || []);
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: String(e) });
    }
  }

  // POST /api/messages
  if (method === "POST" && parsedUrl.pathname === "/api/messages") {
    const body = await parseBody(req);
    if (isInvalidJson(body)) return sendJson(res, 400, { ok: false, message: "Ungültiges JSON" });

    const { chatId, senderId, text } = body;
    if (!chatId || !senderId || !text) {
      return sendJson(res, 400, { ok: false, message: "chatId, senderId, text erforderlich" });
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_id: String(chatId),
          sender_id: String(senderId),
          text: String(text),
        })
        .select()
        .single();

      if (error) return sendJson(res, 500, { ok: false, error: error.message });
      return sendJson(res, 201, data);
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: String(e) });
    }
  }

  /* -------- Fallback -------- */
  return sendJson(res, 404, { message: "Route nicht gefunden" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`API läuft auf http://localhost:${PORT}`);
});
