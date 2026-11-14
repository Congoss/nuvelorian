export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Init-Data, X-Telegram-User-Id, X-Telegram-Username, X-Telegram-Mock-User',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  });
  // X OAuth tokens belong only in server-side player storage, never API responses.
  response.end(JSON.stringify(payload, (key, value) => key === 'x_oauth' ? undefined : value));
}

export function sendData(response, statusCode, data) {
  sendJson(response, statusCode, { data });
}

export function sendError(response, statusCode, message, code = 'API_ERROR', details = null) {
  response.diagnosticCode = code;
  response.diagnosticMessage ||= message;
  sendJson(response, statusCode, {
    message,
    code,
    ...(details ? { details } : {}),
  });
}

export async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 1024 * 1024) {
      throw Object.assign(new Error('Request body too large'), { statusCode: 413, code: 'BODY_TOO_LARGE' });
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) return {};

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};

  try {
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid object');
    return body;
  } catch {
    throw Object.assign(new Error('Invalid JSON object'), { statusCode: 400, code: 'INVALID_JSON' });
  }
}

export function getQuery(url) {
  return Object.fromEntries(url.searchParams.entries());
}
