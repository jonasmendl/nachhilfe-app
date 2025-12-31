import http from "http";
import "dotenv/config";
import dns from "dns";
import { createClient } from "@supabase/supabase-js";

dns.setDefaultResultOrder("ipv4first");

const PORT = process.env.PORT || 4000;

// Supabase Client (nur Backend!)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Debug
console.log("ENV check:", {
  hasUrl: !!process.env.SUPABASE_URL,
  url: process.env.SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  port: process.env.PORT,
});
console.log("SERVER VERSION: full-api-1");

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

  /* ---------------- Teachers (Supabase) ---------------- */

  // GET /api/teachers
  if (method === "GET" && parsedUrl.pathname === "/api/teachers") {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        sendJson(res, 500, { ok: false, error: error.message });
        return;
      }

      sendJson(res, 200, data || []);
      return;
    } catch (e) {
      sendJson(res, 500, { ok: false, error: String(e) });
      return;
    }
  }

  // POST /api/teachers
  if (method === "POST" && parsedUrl.pathname === "/api/teachers") {
    const body = await parseBody(req);
    if (isInvalidJson(body)) {
      sendJson(res, 400, { ok: false, message: "Ungültiges JSON" });
      return;
    }

    if (!body.name) {
      sendJson(res, 400, { ok: false, message: "name ist erforderlich" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("teachers")
        .insert({
          name: body.name,
          subject: body.subject ?? null,
          bio: body.bio ?? null,
        })
        .select()
        .single();

      if (error) {
        sendJson(res, 500, { ok: false, error: error.message });
        return;
      }

      sendJson(res, 201, data);
      return;
    } catch (e) {
      sendJson(res, 500, { ok: false, error: String(e) });
      return;
    }
  }

  /* ---------------- Requests (Supabase) ---------------- */

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

      if (error) {
        sendJson(res, 500, { ok: false, error: error.message });
        return;
      }

      sendJson(res, 200, data || []);
      return;
    } catch (e) {
      sendJson(res, 500, { ok: false, error: String(e) });
      return;
    }
  }

  // POST /api/requests
  if (method === "POST" && parsedUrl.pathname === "/api/requests") {
    const body = await parseBody(req);
    if (isInvalidJson(body)) {
      sendJson(res, 400, { ok: false, message: "Ungültiges JSON" });
      return;
    }

    const { studentId, studentName, teacherId, teacherName, subject, city, when } = body;

    if (!studentId || !studentName || !teacherId || !teacherName) {
      sendJson(res, 400, {
        ok: false,
        message: "studentId, studentName, teacherId, teacherName sind erforderlich",
      });
      return;
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

      if (error) {
        sendJson(res, 500, { ok: false, error: error.message });
        return;
      }

      sendJson(res, 201, data);
      return;
    } catch (e) {
      sendJson(res, 500, { ok: false, error: String(e) });
      return;
    }
  }

  // PATCH /api/requests/:id  (status: pending|accepted|rejected)
  if (method === "PATCH" && parsedUrl.pathname.startsWith("/api/requests/")) {
    const id = parsedUrl.pathname.split("/").pop();
    const body = await parseBody(req);

    if (isInvalidJson(body)) {
      sendJson(res, 400, { ok: false, message: "Ungültiges JSON" });
      return;
    }

    const { status } = body;
    const allowed = ["pending", "accepted", "rejected"];
    if (!allowed.includes(status)) {
      sendJson(res, 400, { ok: false, message: "status muss pending|accepted|rejected sein" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("requests")
        .update({ status })
        .eq("id", String(id))
        .select()
        .single();

      if (error) {
        sendJson(res, 500, { ok: false, error: error.message });
        return;
      }

      sendJson(res, 200, data);
      return;
    } catch (e) {
      sendJson(res, 500, { ok: false, error: String(e) });
      return;
    }
  }

  /* ---------------- Chats (Supabase) ---------------- */

  // POST /api/chats  { requestId, studentId, teacherId }
  if (method === "POST" && parsedUrl.pathname === "/api/chats") {
    const body = await parseBody(req);
    if (isInvalidJson(body)) {
      sendJson(res, 400, { ok: false, message: "Ungültiges JSON" });
      return;
    }

    const { requestId, studentId, teacherId } = body;
    if (!requestId || !studentId || !teacherId) {
      sendJson(res, 400, { ok: false, message: "requestId, studentId, teacherId erforderlich" });
      return;
    }

    try {
      // bereits vorhanden?
      const existing = await supabase
        .from("chats")
        .select("*")
        .eq("request_id", String(requestId))
        .maybeSingle();

      if (existing.error) {
        sendJson(res, 500, { ok: false, error: existing.error.message });
        return;
      }

      if (existing.data) {
        sendJson(res, 200, existing.data);
        return;
      }

      const created = await supabase
        .from("chats")
        .insert({
          request_id: String(requestId),
          student_id: String(studentId),
          teacher_id: String(teacherId),
        })
        .select()
        .single();

      if (created.error) {
        sendJson(res, 500, { ok: false, error: created.error.message });
        return;
      }

      sendJson(res, 201, created.data);
      return;
    } catch (e) {
      sendJson(res, 500, { ok: false, error: String(e) });
      return;
    }
  }

  // GET /api/chats?userId=...
  if (method === "GET" && parsedUrl.pathname === "/api/chats") {
    const userId = parsedUrl.searchParams.get("userId");
    if (!userId) {
      sendJson(res, 400, { ok: false, message: "userId erforderlich" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(`student_id.eq.${userId},teacher_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        sendJson(res, 500, { ok: false, error: error.message });
        return;
      }

      sendJson(res, 200, data || []);
      return;
    } catch (e) {
      sendJson(res, 500, { ok: false, error: String(e) });
      return;
    }
  }

  /* ---------------- Messages (Supabase) ---------------- */

  // GET /api/messages?chatId=...
  if (method === "GET" && parsedUrl.pathname === "/api/messages") {
    const chatId = parsedUrl.searchParams.get("chatId");
    if (!chatId) {
      sendJson(res, 400, { ok: false, message: "chatId erforderlich" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", String(chatId))
        .order("created_at", { ascending: true });

      if (error) {
        sendJson(res, 500, { ok: false, error: error.message });
        return;
      }

      sendJson(res, 200, data || []);
      return;
    } catch (e) {
      sendJson(res, 500, { ok: false, error: String(e) });
      return;
    }
  }

  // POST /api/messages  { chatId, senderId, text }
  if (method === "POST" && parsedUrl.pathname === "/api/messages") {
    const body = await parseBody(req);
    if (isInvalidJson(body)) {
      sendJson(res, 400, { ok: false, message: "Ungültiges JSON" });
      return;
    }

    const { chatId, senderId, text } = body;
    if (!chatId || !senderId || !text) {
      sendJson(res, 400, { ok: false, message: "chatId, senderId, text erforderlich" });
      return;
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

      if (error) {
        sendJson(res, 500, { ok: false, error: error.message });
        return;
      }

      sendJson(res, 201, data);
      return;
    } catch (e) {
      sendJson(res, 500, { ok: false, error: String(e) });
      return;
    }
  }

  /* -------- Fallback -------- */

  sendJson(res, 404, { message: "Route nicht gefunden" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`API läuft auf http://localhost:${PORT}`);
});
