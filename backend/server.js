import http from "http";

const PORT = process.env.PORT || 4000;

/* ---------------- In-memory data ---------------- */

const users = [
  {
    id: 1,
    name: "Anna Schmidt",
    role: "teacher",
    subjects: ["Mathematik", "Physik"],
    location: "Berlin",
    availability: "Nachmittags",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Jonas Meyer",
    role: "student",
    subjects: ["Mathematik"],
    location: "Berlin",
    availability: "Flexibel",
    createdAt: new Date().toISOString(),
  },
];

const requests = [
  {
    id: 1,
    studentId: 2,
    subject: "Mathematik",
    level: "Oberstufe",
    location: "Berlin",
    availability: "Nachmittags",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

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
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body ? JSON.parse(body) : {}));
    req.on("error", reject);
  });
}

/* ---------------- Server ---------------- */

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  const parsedUrl = new URL(url, `http://${req.headers.host}`);

  if (method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (method === "GET" && parsedUrl.pathname === "/api/health") {
    sendJson(res, 200, { status: "ok", time: new Date().toISOString() });
    return;
  }

  if (method === "GET" && parsedUrl.pathname === "/api/users") {
    sendJson(res, 200, users);
    return;
  }

  if (method === "POST" && parsedUrl.pathname === "/api/users") {
    const body = await parseBody(req);
    const { name, role } = body;

    if (!name || !role) {
      sendJson(res, 400, { message: "name und role erforderlich" });
      return;
    }

    const user = {
      id: users.length + 1,
      ...body,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    sendJson(res, 201, user);
    return;
  }

  if (method === "GET" && parsedUrl.pathname === "/api/requests") {
    sendJson(res, 200, requests);
    return;
  }

  if (method === "POST" && parsedUrl.pathname === "/api/requests") {
    const body = await parseBody(req);

    const reqItem = {
      id: requests.length + 1,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...body,
    };

    requests.push(reqItem);
    sendJson(res, 201, reqItem);
    return;
  }

  if (method === "PATCH" && parsedUrl.pathname.startsWith("/api/requests/")) {
    const id = Number(parsedUrl.pathname.split("/").pop());
    const body = await parseBody(req);

    const reqItem = requests.find((r) => r.id === id);
    if (!reqItem) {
      sendJson(res, 404, { message: "Request nicht gefunden" });
      return;
    }

    Object.assign(reqItem, body);
    sendJson(res, 200, reqItem);
    return;
  }

  sendJson(res, 404, { message: "Route nicht gefunden" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`API läuft auf http://192.168.178.47:${PORT}`);
});
