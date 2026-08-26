const SHEETS_WEBHOOK_URL = 'https://script.google.com/a/macros/gameopedia.com/s/AKfycbwJ7xL42MIMIl5YCSqvt8iIrxSCH0XW7ZK5NYlbiRnA4mKXXFFdctNeqzAJeJAJMh3AGA/exec';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !['/api/signup', '/api/cancel'].includes(url.pathname) || event.request.method !== 'POST') return;

  event.respondWith((async () => {
    const response = await fetch(event.request);
    if (response.ok) {
      try {
        const body = await event.request.clone().json();
        event.waitUntil(syncToSheets(url.pathname, body));
      } catch (_) {}
    }
    return response;
  })());
});

async function syncToSheets(pathname, body) {
  try {
    const sportsResponse = await fetch('/api/sports', { credentials: 'same-origin', cache: 'no-store' });
    if (!sportsResponse.ok) return;
    const data = await sportsResponse.json();
    const sport = (data.sports || []).find(s => String(s.id) === String(body.sportId));
    if (!sport) return;

    const payload = {
      action: pathname === '/api/cancel' ? 'remove' : 'upsert',
      sport: sport.name,
      name: body.name || '',
      email: body.email || ''
    };

    // text/plain avoids a CORS preflight. The Apps Script remains restricted
    // to Gameopedia users; the browser supplies the user's Google session.
    await fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'include',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  } catch (_) {
    // Sheets sync is deliberately non-blocking and must never slow down signup.
  }
}
