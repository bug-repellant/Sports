const SHEETS_WEBHOOK_URL = 'https://script.google.com/a/macros/gameopedia.com/s/AKfycbzwlFHqUNxKEahhom7CMdSeAM9_d--DCFm3SOA4gvRXNqZpei_VLUSaaZgWiF-Pe5tIbg/exec';
const SW_VERSION = 'sheets-sync-v4';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Take control immediately so the new sync code replaces stale workers.
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (
    url.origin !== self.location.origin ||
    !['/api/signup', '/api/cancel'].includes(url.pathname) ||
    event.request.method !== 'POST'
  ) {
    return;
  }

  event.respondWith((async () => {
    const response = await fetch(event.request);

    if (response.ok) {
      try {
        const body = await event.request.clone().json();
        event.waitUntil(syncToSheets(url.pathname, body));
      } catch (_) {
        // Ignore malformed/non-JSON requests.
      }
    }

    return response;
  })());
});

async function syncToSheets(pathname, body) {
  try {
    const sportsResponse = await fetch('/api/sports', {
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (!sportsResponse.ok) return;

    const data = await sportsResponse.json();

    const sport = (data.sports || []).find(
      s => String(s.id) === String(body.sportId)
    );

    if (!sport) return;

    // Only current registration state is sent to Sheets.
    // No event, venue, timing, or total-signups fields.
    const payload = {
      action: pathname === '/api/cancel' ? 'remove' : 'upsert',
      sport: sport.name,
      name: body.name || '',
      email: body.email || ''
    };

    await fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
  } catch (_) {
    // Sheets sync must never block the signup UI.
  }
}
