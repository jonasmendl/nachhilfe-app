const http = require('node:http');
const { URL } = require('node:url');

const PORT = process.env.PORT || 4000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const DEFAULT_TEACHER_ID = 'teacher-1';

const users = [];
let userIdCounter = 1;

const studentFeed = [
  {
    id: 'stu-1',
    name: 'Lena Hoffmann',
    subjects: ['Mathe', 'Physik'],
    location: 'Berlin',
    price: 25,
    bio: 'Geduldige Lehramtsstudentin im 5. Semester, Schwerpunkt Naturwissenschaften.',
    imageUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39',
  },
  {
    id: 'stu-2',
    name: 'Tom Schneider',
    subjects: ['Englisch', 'Geschichte'],
    location: 'Hamburg',
    price: 22,
    bio: 'Spricht fließend Englisch, liebt Debattierclubs und Unterricht zum Mitmachen.',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
  },
  {
    id: 'stu-3',
    name: 'Sara Becker',
    subjects: ['Deutsch', 'Latein'],
    location: 'München',
    price: 24,
    bio: 'Hilft gern bei Aufsätzen, Grammatik und Abiturvorbereitung.',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
  },
  {
    id: 'stu-4',
    name: 'Maximilian König',
    subjects: ['Mathe', 'Informatik'],
    location: 'Köln',
    price: 26,
    bio: 'Coding-Fan mit Fokus auf Logik, Algorithmen und Mathe-Grundlagen.',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
  },
  {
    id: 'stu-5',
    name: 'Emily Wagner',
    subjects: ['Biologie', 'Chemie'],
    location: 'Frankfurt',
    price: 23,
    bio: 'Bereitet auf Klausuren vor und erklärt Experimente Schritt für Schritt.',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
  },
  {
    id: 'stu-6',
    name: 'Jonas Weber',
    subjects: ['Mathe', 'Englisch'],
    location: 'Stuttgart',
    price: 21,
    bio: 'Bringt Humor in den Unterricht und erklärt gerne mit Alltagsbeispielen.',
    imageUrl: 'https://images.unsplash.com/photo-1502764613149-7f1d229e230f',
  },
  {
    id: 'stu-7',
    name: 'Mira Scholz',
    subjects: ['Französisch', 'Deutsch'],
    location: 'Düsseldorf',
    price: 24,
    bio: 'War für ein Jahr in Paris und hilft bei Aussprache und Grammatik.',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  },
  {
    id: 'stu-8',
    name: 'Leon Fischer',
    subjects: ['Physik', 'Mathe'],
    location: 'Leipzig',
    price: 27,
    bio: 'Schwerpunkt Mechanik und Elektrotechnik, liebt anschauliche Beispiele.',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
  },
];

let requestIdCounter = 1;
const requests = [
  {
    id: requestIdCounter++,
    parentId: 101,
    studentId: 'stu-1',
    teacherId: DEFAULT_TEACHER_ID,
    message: 'Beispielanfrage: Mathe-Nachhilfe am Dienstag',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

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

function createToken(userId) {
  return `dummy-token-${userId}`;
}

function extractIdFromPath(pathname, prefix) {
  if (!pathname.startsWith(prefix)) return null;
  const idPart = pathname.slice(prefix.length);
  return idPart ? Number(idPart) : null;
}

const server = http.createServer(async (req, res) => {
  const { method, url: requestUrl } = req;
  const url = new URL(requestUrl, `http://${req.headers.host}`);

  if (method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (method === 'POST' && url.pathname === '/auth/signup') {
    try {
      const rawBody = await parseRequestBody(req);
      const body = rawBody ? JSON.parse(rawBody) : {};
      const { email, password, role } = body;

      if (!email || !password || !role) {
        sendJson(res, 400, { message: 'email, password und role sind erforderlich.' });
        return;
      }

      const existingUser = users.find((user) => user.email === email);
      if (existingUser) {
        sendJson(res, 409, { message: 'User existiert bereits.' });
        return;
      }

      const newUser = { id: userIdCounter++, email, password, role };
      users.push(newUser);
      const token = createToken(newUser.id);
      sendJson(res, 201, { token, user: { id: newUser.id, email, role } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ungültige Anfrage';
      const statusCode = message === 'Payload too large' ? 413 : 400;
      sendJson(res, statusCode, { message: `Konnte Anfrage nicht lesen: ${message}` });
    }
    return;
  }

  if (method === 'POST' && url.pathname === '/auth/login') {
    try {
      const rawBody = await parseRequestBody(req);
      const body = rawBody ? JSON.parse(rawBody) : {};
      const { email, password } = body;

      if (!email || !password) {
        sendJson(res, 400, { message: 'email und password sind erforderlich.' });
        return;
      }

      const user = users.find((item) => item.email === email && item.password === password);
      if (!user) {
        sendJson(res, 401, { message: 'Ungültige Zugangsdaten.' });
        return;
      }

      const token = createToken(user.id);
      sendJson(res, 200, { token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ungültige Anfrage';
      const statusCode = message === 'Payload too large' ? 413 : 400;
      sendJson(res, statusCode, { message: `Konnte Anfrage nicht lesen: ${message}` });
    }
    return;
  }

  if (method === 'GET' && url.pathname === '/students/feed') {
    sendJson(res, 200, studentFeed);
    return;
  }

  if (method === 'POST' && url.pathname === '/requests') {
    try {
      const rawBody = await parseRequestBody(req);
      const body = rawBody ? JSON.parse(rawBody) : {};
      const { parentId, studentId, teacherId, message } = body;

      const parsedParentId = Number(parentId);
      if (!parentId || !studentId || !message) {
        sendJson(res, 400, { message: 'parentId, studentId und message sind erforderlich.' });
        return;
      }

      if (!Number.isFinite(parsedParentId)) {
        sendJson(res, 400, { message: 'parentId muss eine Zahl sein.' });
        return;
      }

      const request = {
        id: requestIdCounter++,
        parentId: parsedParentId,
        studentId: String(studentId),
        teacherId: teacherId ? String(teacherId) : DEFAULT_TEACHER_ID,
        message,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      requests.push(request);
      sendJson(res, 201, request);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ungültige Anfrage';
      const statusCode = message === 'Payload too large' ? 413 : 400;
      sendJson(res, statusCode, { message: `Konnte Anfrage nicht lesen: ${message}` });
    }
    return;
  }

  if (method === 'GET' && url.pathname === '/requests') {
    const studentId = url.searchParams.get('studentId');
    const teacherId = url.searchParams.get('teacherId');

    if (!studentId && !teacherId) {
      sendJson(res, 400, { message: 'studentId oder teacherId Query-Parameter ist erforderlich.' });
      return;
    }

    const filtered = requests.filter((entry) => {
      const matchesStudent = studentId ? entry.studentId === studentId : true;
      const matchesTeacher = teacherId ? entry.teacherId === teacherId : true;
      return matchesStudent && matchesTeacher;
    });

    sendJson(res, 200, filtered);
    return;
  }

  if (method === 'PATCH' && url.pathname.startsWith('/requests/')) {
    const requestId = extractIdFromPath(url.pathname, '/requests/');
    if (!requestId) {
      sendJson(res, 400, { message: 'Ungültige Request-ID.' });
      return;
    }

    try {
      const rawBody = await parseRequestBody(req);
      const body = rawBody ? JSON.parse(rawBody) : {};
      const { status } = body;

      if (!['accepted', 'declined'].includes(status)) {
        sendJson(res, 400, { message: 'status muss accepted oder declined sein.' });
        return;
      }

      const requestEntry = requests.find((item) => item.id === requestId);
      if (!requestEntry) {
        sendJson(res, 404, { message: 'Request nicht gefunden.' });
        return;
      }

      requestEntry.status = status;
      sendJson(res, 200, requestEntry);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ungültige Anfrage';
      const statusCode = message === 'Payload too large' ? 413 : 400;
      sendJson(res, statusCode, { message: `Konnte Anfrage nicht lesen: ${message}` });
    }
    return;
  }

  sendJson(res, 404, { message: 'Route nicht gefunden' });
});

server.listen(PORT, () => {
  console.log(`API server läuft auf Port ${PORT}`);
});
