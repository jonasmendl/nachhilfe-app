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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
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

  sendJson(res, 404, { message: 'Route nicht gefunden' });
});

server.listen(PORT, () => {
  console.log(`API server läuft auf Port ${PORT}`);
});
