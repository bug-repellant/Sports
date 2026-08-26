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
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '434952931282-0pnmfsskbrkq3ha0gl8oo3lhn2i5jqha.apps.googleusercontent.com';

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
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  }
}

// Google Workspace automatic browser authentication.
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(401).json({ success: false, error: 'Google identity credential missing.' });

    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!verifyRes.ok) return res.status(401).json({ success: false, error: 'Invalid Google identity.' });

    const claims = await verifyRes.json();
    const email = String(claims.email || '').trim().toLowerCase();
    const hostedDomain = String(claims.hd || '').trim().toLowerCase();
    const audience = String(claims.aud || '');

    if (audience !== GOOGLE_CLIENT_ID) return res.status(401).json({ success: false, error: 'Google identity was issued for a different application.' });
    if (!claims.email_verified) return res.status(403).json({ success: false, error: 'Your Google email is not verified.' });
    if (!isGameopediaEmail(email) || hostedDomain !== 'gameopedia.com') {
      return res.status(403).json({ success: false, error: 'Only Gameopedia Google Workspace accounts are allowed.' });
    }

    const result = db.loginGoogleUser(email, claims.name || email.split('@')[0]);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Google authentication error:', err);
    res.status(401).json({ success: false, error: 'Google authentication failed.' });
  }
});

// Legacy password auth is intentionally disabled for normal users.
app.post('/api/auth/register', (req, res) => res.status(410).json({ success: false, error: 'Password registration is disabled. Use your Gameopedia Google account.' }));
app.post('/api/auth/login', (req, res) => res.status(410).json({ success: false, error: 'Password login is disabled. Use your Gameopedia Google account.' }));

app.post('/api/auth/admin-verify', (req, res) => {
  const { password } = req.body;
  if (!password || !db.verifyAdminPassword(password)) return res.status(401).json({ success: false, error: 'Invalid admin password.' });
  const adminToken = Buffer.from(`admin_session_${Date.now()}`).toString('base64');
  res.json({ success: true, adminToken, sheetWebhookUrl: db.getSheetWebhookUrl(), chatWebhookUrl: db.getChatWebhookUrl() });
});

app.get('/api/sports', (req, res) => {
  const weekInfo = getNextWeekSignupInfo();
  res.json({ weekInfo, sports: db.getSports(), stats: db.getStats() });
});

app.post('/api/signup', (req, res) => {
  try {
    const { sportId, email, name, userToken } = req.body;
    if (!email || !isGameopediaEmail(email)) return res.status(403).json({ success: false, error: 'Only @gameopedia.com email addresses are allowed.' });
    if (!userToken) return res.status(401).json({ success: false, error: 'You must be authenticated with your Gameopedia Google account.' });
    const weekInfo = getNextWeekSignupInfo();
    if (!weekInfo.isSignupOpen) return res.status(400).json({ success: false, error: `Signups closed for next week on ${weekInfo.fridayDeadlineDisplay}.` });
    const result = db.signup(sportId, { name, email });
    broadcast('SPORTS_UPDATED', { sports: db.getSports(), stats: db.getStats() });
    res.json({ success: true, sport: result.sport, isNew: result.isNew, stats: db.getStats() });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

app.post('/api/cancel', (req, res) => {
  try {
    const { sportId, email, userToken } = req.body;
    if (!email || !isGameopediaEmail(email)) return res.status(403).json({ success: false, error: 'Unauthorized email.' });
    if (!userToken) return res.status(401).json({ success: false, error: 'You must be authenticated with your Gameopedia Google account.' });
    const weekInfo = getNextWeekSignupInfo();
    if (!weekInfo.isSignupOpen) return res.status(400).json({ success: false, error: `Signups closed on ${weekInfo.fridayDeadlineDisplay}.` });
    const result = db.cancelSignup(sportId, email);
    broadcast('SPORTS_UPDATED', { sports: db.getSports(), stats: db.getStats() });
    res.json({ success: true, sport: result.sport, stats: db.getStats() });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

app.put('/api/admin/sport/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { venue, timing, adminToken } = req.body;
    if (!adminToken) return res.status(403).json({ success: false, error: 'Admin password verification required.' });
    const updated = db.updateVenueTiming(id, { venue, timing });
    broadcast('SPORTS_UPDATED', { sports: db.getSports(), stats: db.getStats() });
    res.json({ success: true, sport: updated });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

app.post('/api/admin/google-chat/broadcast/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminToken } = req.body;
    if (!adminToken) return res.status(403).json({ success: false, error: 'Admin password verification required.' });
    const sport = db.getSportById(id);
    if (!sport) return res.status(404).json({ success: false, error: 'Sport not found' });
    const weekInfo = getNextWeekSignupInfo();
    await integrations.broadcastToGoogleChat(sport, weekInfo.label);
    res.json({ success: true, message: `Broadcast sent to Google Chat for ${sport.name}!` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/calendar/gcal-url/:id', (req, res) => {
  const sport = db.getSportById(req.params.id);
  if (!sport) return res.status(404).json({ success: false, error: 'Sport not found' });
  const weekInfo = getNextWeekSignupInfo();
  res.json({ url: integrations.getGoogleCalendarInviteUrl(sport, weekInfo) });
});

app.get('/api/calendar/export/:id', (req, res) => {
  const sport = db.getSportById(req.params.id);
  if (!sport) return res.status(404).send('Sport not found');
  const weekInfo = getNextWeekSignupInfo();
  const ics = integrations.generateICSForSport(sport, weekInfo);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="gameopedia_${sport.id}_invite.ics"`);
  res.send(ics);
});

app.post('/api/admin/integrations/config', (req, res) => {
  const { sheetWebhookUrl, chatWebhookUrl, adminToken } = req.body;
  if (!adminToken) return res.status(403).json({ success: false, error: 'Admin password verification required.' });
  if (sheetWebhookUrl !== undefined) db.setSheetWebhookUrl(sheetWebhookUrl);
  if (chatWebhookUrl !== undefined) db.setChatWebhookUrl(chatWebhookUrl);
  res.json({ success: true, sheetWebhookUrl: db.getSheetWebhookUrl(), chatWebhookUrl: db.getChatWebhookUrl() });
});

app.post('/api/admin/change-password', (req, res) => {
  try {
    const { newPassword, adminToken } = req.body;
    if (!adminToken) return res.status(403).json({ success: false, error: 'Admin authorization required.' });
    db.updateAdminPassword(newPassword);
    res.json({ success: true, message: 'Admin password updated successfully!' });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

app.post('/api/admin/reset-signups', (req, res) => {
  try {
    const { adminToken } = req.body;
    if (!adminToken) return res.status(403).json({ success: false, error: 'Admin authorization required.' });
    db.clearAllSignups();
    broadcast('SPORTS_UPDATED', { sports: db.getSports(), stats: db.getStats() });
    res.json({ success: true, sports: db.getSports(), stats: db.getStats() });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

app.post('/api/admin/clear-users', (req, res) => {
  try {
    const { adminToken } = req.body;
    if (!adminToken) return res.status(403).json({ success: false, error: 'Admin authorization required.' });
    db.clearTestUsers();
    res.json({ success: true, message: 'Test users cleared successfully!' });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

app.get('/api/admin/sheets/template', (req, res) => res.json({ code: integrations.getAppsScriptCode() }));
app.get('/api/export/csv', (req, res) => {
  const csv = integrations.generateCSV(db.getSports());
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="gameopedia_sports_signups.csv"');
  res.send(csv);
});

app.use(express.static(CLIENT_DIST));
app.get('*', (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));

server.listen(PORT, () => console.log(`🚀 Gameopedia Sports server running on http://localhost:${PORT}`));
