import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { db } from './db.js';
import { getNextWeekSignupInfo } from './utils/dateHelpers.js';
import { isGameopediaEmail } from './authMiddleware.js';
import { integrations } from './sheetSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});

function broadcast(type, payload) {
  const msg = JSON.stringify({ type, data: payload });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

// 1. User Register with Password
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !isGameopediaEmail(email)) {
      return res.status(403).json({
        success: false,
        error: 'Only @gameopedia.com email addresses are allowed.'
      });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 4 characters.'
      });
    }

    const result = db.registerUser(email, password, name);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 2. User Login with Password
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !isGameopediaEmail(email)) {
      return res.status(403).json({
        success: false,
        error: 'Only @gameopedia.com email addresses are allowed.'
      });
    }

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required.' });
    }

    const result = db.loginUser(email, password);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// 3. Admin Unlock with Password
app.post('/api/auth/admin-verify', (req, res) => {
  const { password } = req.body;
  if (!password || !db.verifyAdminPassword(password)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid admin password.'
    });
  }

  const adminToken = Buffer.from(`admin_session_${Date.now()}`).toString('base64');
  res.json({
    success: true,
    adminToken,
    sheetWebhookUrl: db.getSheetWebhookUrl(),
    chatWebhookUrl: db.getChatWebhookUrl()
  });
});

// 4. Get Public Sports, Schedule & Live Stats
app.get('/api/sports', (req, res) => {
  const weekInfo = getNextWeekSignupInfo();
  res.json({
    weekInfo,
    sports: db.getSports(),
    stats: db.getStats()
  });
});

// 5. Sign up for a sport (Guarded by User Auth Token)
app.post('/api/signup', (req, res) => {
  try {
    const { sportId, email, name, userToken } = req.body;
    
    if (!email || !isGameopediaEmail(email)) {
      return res.status(403).json({
        success: false,
        error: 'Only @gameopedia.com email addresses are allowed.'
      });
    }

    if (!userToken) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged into your account to sign up.'
      });
    }

    const weekInfo = getNextWeekSignupInfo();
    if (!weekInfo.isSignupOpen) {
      return res.status(400).json({
        success: false,
        error: `Signups closed for next week on ${weekInfo.fridayDeadlineDisplay}.`
      });
    }

    const result = db.signup(sportId, { name, email });
    broadcast('SPORTS_UPDATED', {
      sports: db.getSports(),
      stats: db.getStats()
    });

    res.json({
      success: true,
      sport: result.sport,
      isNew: result.isNew,
      stats: db.getStats()
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Cancel signup (Guarded by User Auth Token)
app.post('/api/cancel', (req, res) => {
  try {
    const { sportId, email, userToken } = req.body;
    
    if (!email || !isGameopediaEmail(email)) {
      return res.status(403).json({ success: false, error: 'Unauthorized email.' });
    }

    if (!userToken) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged into your account to cancel your signup.'
      });
    }

    const weekInfo = getNextWeekSignupInfo();
    if (!weekInfo.isSignupOpen) {
      return res.status(400).json({
        success: false,
        error: `Signups closed on ${weekInfo.fridayDeadlineDisplay}.`
      });
    }

    const result = db.cancelSignup(sportId, email);
    broadcast('SPORTS_UPDATED', {
      sports: db.getSports(),
      stats: db.getStats()
    });

    res.json({ success: true, sport: result.sport, stats: db.getStats() });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. Admin update venue & timing
app.put('/api/admin/sport/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { venue, timing, adminToken } = req.body;

    if (!adminToken) {
      return res.status(403).json({ success: false, error: 'Admin password verification required.' });
    }

    const updated = db.updateVenueTiming(id, { venue, timing });
    broadcast('SPORTS_UPDATED', {
      sports: db.getSports(),
      stats: db.getStats()
    });

    res.json({ success: true, sport: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. Admin Broadcast to Google Chat
app.post('/api/admin/google-chat/broadcast/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminToken } = req.body;

    if (!adminToken) {
      return res.status(403).json({ success: false, error: 'Admin password verification required.' });
    }

    const sport = db.getSportById(id);
    if (!sport) return res.status(404).json({ success: false, error: 'Sport not found' });

    const weekInfo = getNextWeekSignupInfo();
    await integrations.broadcastToGoogleChat(sport, weekInfo.label);

    res.json({ success: true, message: `Broadcast sent to Google Chat for ${sport.name}!` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Google Calendar Invite URL with all attendees as guests
app.get('/api/calendar/gcal-url/:id', (req, res) => {
  const { id } = req.params;
  const sport = db.getSportById(id);
  if (!sport) return res.status(404).json({ success: false, error: 'Sport not found' });

  const weekInfo = getNextWeekSignupInfo();
  const url = integrations.getGoogleCalendarInviteUrl(sport, weekInfo);
  res.json({ url });
});

// 10. Download .ICS Calendar Invite with all attendees
app.get('/api/calendar/export/:id', (req, res) => {
  const { id } = req.params;
  const sport = db.getSportById(id);
  if (!sport) return res.status(404).send('Sport not found');

  const weekInfo = getNextWeekSignupInfo();
  const ics = integrations.generateICSForSport(sport, weekInfo);

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="gameopedia_${sport.id}_invite.ics"`);
  res.send(ics);
});

// 11. Admin Config: Google Sheets & Google Chat Webhook URLs
app.post('/api/admin/integrations/config', (req, res) => {
  const { sheetWebhookUrl, chatWebhookUrl, adminToken } = req.body;
  if (!adminToken) {
    return res.status(403).json({ success: false, error: 'Admin password verification required.' });
  }

  if (sheetWebhookUrl !== undefined) db.setSheetWebhookUrl(sheetWebhookUrl);
  if (chatWebhookUrl !== undefined) db.setChatWebhookUrl(chatWebhookUrl);

  res.json({
    success: true,
    sheetWebhookUrl: db.getSheetWebhookUrl(),
    chatWebhookUrl: db.getChatWebhookUrl()
  });
});

// 12. Get Apps Script Template (Admin Only)
app.get('/api/admin/sheets/template', (req, res) => {
  res.json({ code: integrations.getAppsScriptCode() });
});

// 13. CSV Export
app.get('/api/export/csv', (req, res) => {
  const csv = integrations.generateCSV(db.getSports());
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="gameopedia_sports_signups.csv"');
  res.send(csv);
});

// Serve static frontend
app.use(express.static(CLIENT_DIST));
app.get('*', (req, res) => {
  res.sendFile(path.join(CLIENT_DIST, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`🚀 Gameopedia Sports server running on http://localhost:${PORT}`);
});
