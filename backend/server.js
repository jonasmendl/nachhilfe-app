const http = require('node:http');
const { URL } = require('node:url');

const PORT = process.env.PORT || 4000;

const lessons = [
  {
    id: 1,
    subject: 'Mathematik',
    tutor: 'Anna Schmidt',
    durationMinutes: 60,
    level: 'Oberstufe',
  },
  {
    id: 2,
    subject: 'Englisch',
    tutor: 'Lukas Weber',
    durationMinutes: 45,
    level: 'Mittelstufe',
  },
  {
    id: 3,
    subject: 'Physik',
    tutor: 'Mara Keller',
    durationMinutes: 90,
    level: 'Abitur',
  },
];

const users = [
  {
    id: 1,
    name: 'Anna Schmidt',
    role: 'teacher',
    subjects: ['Mathematik', 'Physik'],
    location: 'Berlin',
    availability: 'Nachmittags',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Jonas Meyer',
    role: 'student',
    subjects: ['Mathematik'],
    location: 'Berlin',
    availability: 'Flexibel',
    createdAt: new Date().toISOString(),
  },
];

const requests = [
  {
    id: 1,
    studentId: 2,
    subject: 'Mathematik',
    level: 'Oberstufe',
    location: 'Berlin',
    availability: 'Nachmittags',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    studentId: 2,
    subject: 'Englisch',
    level: 'Mittelstufe',
    location: 'Online',
    availability: 'Abends',
    status: 'accepted',
    teacherId: 1,
    createdAt: new Date().toISOString(),
  },
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders,
  });
  res.end(JSON.stringify(payload));
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });

    req.on('end', () => resolve(body));
    req.on('error', (error) => reject(error));
  });
}

const server = http.createServer(async (req, res) => {
  const { method, url: requestUrl } = req;
  const url = new URL(requestUrl, `http://${req.headers.host}`);

  if (method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/info') {
    sendJson(res, 200, {
      name: 'Nachhilfe API',
      version: '1.0.0',
      description: 'Einfache API für die Nachhilfe-App',
    });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/users') {
    sendJson(res, 200, { items: users });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/users') {
    let data;

    try {
      const body = await parseRequestBody(req);
      data = body ? JSON.parse(body) : {};
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ungültige Anfrage';
      const statusCode = message === 'Payload too large' ? 413 : 400;
      sendJson(res, statusCode, { message: `Konnte Anfrage nicht lesen: ${message}` });
      return;
    }

    const { name, role, subjects = [], location = null, availability = null } = data;

    if (!name || !role) {
      sendJson(res, 400, { message: 'Bitte name und role angeben.' });
      return;
    }

    if (role !== 'student' && role !== 'teacher') {
      sendJson(res, 400, { message: "role muss 'student' oder 'teacher' sein." });
      return;
    }

    const newUser = {
      id: users.length + 1,
      name,
      role,
      subjects,
      location,
      availability,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    sendJson(res, 201, newUser);
    return;
  }

  if (method === 'GET' && url.pathname === '/api/lessons') {
    sendJson(res, 200, { items: lessons });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/lessons') {
    let data;

    try {
      const body = await parseRequestBody(req);
      data = body ? JSON.parse(body) : {};
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ungültige Anfrage';
      const statusCode = message === 'Payload too large' ? 413 : 400;
      sendJson(res, statusCode, { message: `Konnte Anfrage nicht lesen: ${message}` });
      return;
    }

    const { subject, tutor, durationMinutes, level } = data;

    if (!subject || !tutor || !durationMinutes || !level) {
      sendJson(res, 400, { message: 'Bitte subject, tutor, durationMinutes und level angeben.' });
      return;
    }

    const parsedDuration = Number(durationMinutes);
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      sendJson(res, 400, { message: 'durationMinutes muss eine positive Zahl sein.' });
      return;
    }

    const newLesson = {
      id: lessons.length + 1,
      subject,
      tutor,
      durationMinutes: parsedDuration,
      level,
    };

    lessons.push(newLesson);
    sendJson(res, 201, newLesson);
    return;
  }

  if (method === 'GET' && url.pathname === '/api/requests') {
    const statusFilter = url.searchParams.get('status');
    const studentId = url.searchParams.get('studentId');
    const teacherId = url.searchParams.get('teacherId');

    const items = requests.filter((request) => {
      if (statusFilter && request.status !== statusFilter) return false;
      if (studentId && String(request.studentId) !== studentId) return false;
      if (teacherId && String(request.teacherId) !== teacherId) return false;
      return true;
    });

    sendJson(res, 200, { items });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/requests') {
    let data;

    try {
      const body = await parseRequestBody(req);
      data = body ? JSON.parse(body) : {};
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ungültige Anfrage';
      const statusCode = message === 'Payload too large' ? 413 : 400;
      sendJson(res, statusCode, { message: `Konnte Anfrage nicht lesen: ${message}` });
      return;
    }

    const {
      studentId,
      subject,
      level = null,
      location = null,
      availability = null,
      description = null,
    } = data;

    if (!studentId || !subject) {
      sendJson(res, 400, { message: 'Bitte studentId und subject angeben.' });
      return;
    }

    const student = users.find((user) => user.id === Number(studentId) && user.role === 'student');
    if (!student) {
      sendJson(res, 400, { message: 'Ungültiger studentId: Student nicht gefunden.' });
      return;
    }

    const newRequest = {
      id: requests.length + 1,
      studentId: student.id,
      subject,
      level,
      location,
      availability,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    requests.push(newRequest);
    sendJson(res, 201, newRequest);
    return;
  }

  if (method === 'PATCH' && url.pathname.startsWith('/api/requests/')) {
    const parts = url.pathname.split('/');
    const id = Number(parts[3]);

    if (!Number.isFinite(id)) {
      sendJson(res, 400, { message: 'Ungültige Request-ID.' });
      return;
    }

    let data;

    try {
      const body = await parseRequestBody(req);
      data = body ? JSON.parse(body) : {};
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ungültige Anfrage';
      const statusCode = message === 'Payload too large' ? 413 : 400;
      sendJson(res, statusCode, { message: `Konnte Anfrage nicht lesen: ${message}` });
      return;
    }

    const { status, teacherId } = data;
    const allowedStatus = ['pending', 'accepted', 'rejected'];

    if (status && !allowedStatus.includes(status)) {
      sendJson(res, 400, { message: "status muss pending, accepted oder rejected sein." });
      return;
    }

    const request = requests.find((item) => item.id === id);
    if (!request) {
      sendJson(res, 404, { message: 'Request nicht gefunden.' });
      return;
    }

    if (teacherId !== undefined) {
      const teacher = users.find((user) => user.id === Number(teacherId) && user.role === 'teacher');
      if (!teacher) {
        sendJson(res, 400, { message: 'Ungültiger teacherId: Teacher nicht gefunden.' });
        return;
      }
      request.teacherId = teacher.id;
    }

    if (status) {
      request.status = status;
    }

    sendJson(res, 200, request);
    return;
  }

  sendJson(res, 404, { message: 'Route nicht gefunden' });
});

server.listen(PORT, () => {
  console.log(`API server läuft auf Port ${PORT}`);
});
