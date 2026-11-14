import { handleRequest } from '../server/app.js';

export default async function handler(request, response) {
  const originalUrl = request.url || '/';

  if (originalUrl === '/api' || originalUrl === '/api/') {
    request.url = '/health';
  } else if (originalUrl.startsWith('/api/')) {
    request.url = originalUrl.slice(4) || '/';
  }

  return handleRequest(request, response);
}
