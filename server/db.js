import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { SPORTS } from './defaultData.js';
import { getNextWeekSignupInfo } from './utils/dateHelpers.js';
import { integrations } from './sheetSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'db.json');

function hashPassword(password) { return crypto.createHash('sha256').update(password.trim()).digest('hex'); }

export class Database {
  constructor() { this.data = { weekId: '', adminPasswordHash: hashPassword('gameopedia@admin2026'), sheetWebhookUrl: '', chatWebhookUrl: '', users: [], sports: [] }; this.init(); }

  init() {
    try {
      const dataDir = path.dirname(DB_FILE); if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const nextWeek = getNextWeekSignupInfo();
      if (fs.existsSync(DB_FILE)) {
        this.data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        if (!this.data.adminPasswordHash) this.data.adminPasswordHash = hashPassword('gameopedia@admin2026');
        if (!this.data.users || this.data.users.length === 0) this.seedInitialUsers();
        // A deployment may contain an empty DB snapshot. Never allow that to hide the default sports.
        if (!Array.isArray(this.data.sports) || this.data.sports.length === 0 || this.data.weekId !== nextWeek.weekId) {
          this.resetForWeek(nextWeek.weekId);
        } else {
          this.data.sports = this.data.sports.map(s => { const match = SPORTS.find(sp => sp.id === s.id); return match ? { ...s, image: match.image, gradient: match.gradient, tagline: match.tagline, category: match.category, description: match.description, themeColor: match.themeColor } : s; });
          this.save();
        }
      } else {
        this.seedInitialUsers(); this.resetForWeek(nextWeek.weekId);
      }
      if (this.data.sheetWebhookUrl) integrations.setSheetWebhookUrl(this.data.sheetWebhookUrl);
      if (this.data.chatWebhookUrl) integrations.setChatWebhookUrl(this.data.chatWebhookUrl);
    } catch (err) {
      console.error('Database initialization error:', err); const nextWeek = getNextWeekSignupInfo(); this.seedInitialUsers(); this.resetForWeek(nextWeek.weekId);
    }
  }

  seedInitialUsers() {
    this.data.users = [
      { email: 'aravind@gameopedia.com', name: 'Aravind', passwordHash: hashPassword('admin123'), role: 'admin', createdAt: new Date().toISOString() },
      { email: 'sarah.jenkins@gameopedia.com', name: 'Sarah Jenkins', passwordHash: hashPassword('password123'), role: 'user', createdAt: new Date().toISOString() },
      { email: 'marcus.chen@gameopedia.com', name: 'Marcus Chen', passwordHash: hashPassword('password123'), role: 'user', createdAt: new Date().toISOString() },
      { email: 'priya.sharma@gameopedia.com', name: 'Priya Sharma', passwordHash: hashPassword('password123'), role: 'user', createdAt: new Date().toISOString() }
    ];
  }

  resetForWeek(weekId) {
    this.data.weekId = weekId;
    this.data.sports = SPORTS.map(s => ({ id: s.id, name: s.name, icon: s.icon, category: s.category, defaultDay: s.defaultDay, image: s.image, gradient: s.gradient, tagline: s.tagline, description: s.description, themeColor: s.themeColor, venue: 'TBA', timing: 'TBA', signups: [] }));
    this.save();
  }
  save() { try { fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8'); } catch (err) { console.error('Error saving db.json:', err); } }
  registerUser(email, password, customName) { const cleanEmail = email.trim().toLowerCase(); const existing = this.data.users.find(u => u.email.toLowerCase() === cleanEmail); if (existing) throw new Error('An account with this email already exists. Please log in.'); const name = customName || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); const role = cleanEmail === 'aravind@gameopedia.com' || cleanEmail.startsWith('admin') ? 'admin' : 'user'; const user = { email: cleanEmail, name, passwordHash: hashPassword(password), role, createdAt: new Date().toISOString() }; this.data.users.push(user); this.save(); const token = Buffer.from(`${user.email}:${Date.now()}`).toString('base64'); return { user: { email: user.email, name: user.name, role: user.role }, token }; }
  loginGoogleUser(email, name) { const cleanEmail = email.trim().toLowerCase(); let user = this.data.users.find(u => u.email.toLowerCase() === cleanEmail); if (!user) { user = { email: cleanEmail, name: (name || cleanEmail.split('@')[0]).trim(), passwordHash: '', role: 'user', createdAt: new Date().toISOString() }; this.data.users.push(user); this.save(); } else if (name && user.name !== name) { user.name = name.trim(); this.save(); } const token = Buffer.from(`google:${user.email}:${Date.now()}`).toString('base64'); return { user: { email: user.email, name: user.name, role: user.role }, token }; }
  loginUser(email, password) { const cleanEmail = email.trim().toLowerCase(); const user = this.data.users.find(u => u.email.toLowerCase() === cleanEmail); if (!user) return this.registerUser(email, password); if (user.passwordHash !== hashPassword(password)) throw new Error('Incorrect password. Please try again.'); const token = Buffer.from(`${user.email}:${Date.now()}`).toString('base64'); return { user: { email: user.email, name: user.name, role: user.role }, token }; }
  updateAdminPassword(newPassword) { if (!newPassword || newPassword.trim().length < 4) throw new Error('Password must be at least 4 characters.'); this.data.adminPasswordHash = hashPassword(newPassword); this.save(); return true; }
  verifyAdminPassword(password) { if (!password) return false; return hashPassword(password) === this.data.adminPasswordHash || password === process.env.ADMIN_PASSWORD; }
  clearAllSignups() { this.data.sports = this.data.sports.map(s => ({ ...s, venue: 'TBA', timing: 'TBA', signups: [] })); this.save(); return this.data.sports; }
  clearTestUsers() { this.data.users = []; this.save(); return this.data.users; }
  getSports() { return this.data.sports; }
  getSportById(id) { return this.data.sports.find(s => s.id === id); }
  signup(sportId, { name, email }) { const sport = this.getSportById(sportId); if (!sport) throw new Error('Sport not found'); const cleanEmail = email.trim().toLowerCase(); const cleanName = (name || cleanEmail.split('@')[0]).trim(); const existing = sport.signups.find(p => p.email.toLowerCase() === cleanEmail); if (existing) return { sport, isNew: false }; sport.signups.push({ name: cleanName, email: cleanEmail, signedUpAt: new Date().toISOString() }); this.save(); integrations.dispatchSheetSync('SIGNUP', { sportName: sport.name, userName: cleanName, userEmail: cleanEmail, venue: sport.venue, timing: sport.timing, totalSignups: sport.signups.length }); return { sport, isNew: true, signup: sport.signups[sport.signups.length - 1] }; }
  cancelSignup(sportId, email) { const sport = this.getSportById(sportId); if (!sport) throw new Error('Sport not found'); const cleanEmail = email.trim().toLowerCase(); const idx = sport.signups.findIndex(p => p.email.toLowerCase() === cleanEmail); if (idx === -1) return { sport, removed: false }; const removed = sport.signups[idx]; sport.signups.splice(idx, 1); this.save(); integrations.dispatchSheetSync('CANCEL', { sportName: sport.name, userName: removed.name, userEmail: cleanEmail, venue: sport.venue, timing: sport.timing, totalSignups: sport.signups.length }); return { sport, removed: true }; }
  updateVenueTiming(sportId, { venue, timing }) { const sport = this.getSportById(sportId); if (!sport) throw new Error('Sport not found'); if (venue !== undefined) sport.venue = venue.trim() || 'TBA'; if (timing !== undefined) sport.timing = timing.trim() || 'TBA'; this.save(); return sport; }
  setSheetWebhookUrl(url) { this.data.sheetWebhookUrl = (url || '').trim(); integrations.setSheetWebhookUrl(this.data.sheetWebhookUrl); this.save(); }
  getSheetWebhookUrl() { return this.data.sheetWebhookUrl; }
  setChatWebhookUrl(url) { this.data.chatWebhookUrl = (url || '').trim(); integrations.setChatWebhookUrl(this.data.chatWebhookUrl); this.save(); }
  getChatWebhookUrl() { return this.data.chatWebhookUrl; }
  getStats() { const totalSignups = this.data.sports.reduce((acc, s) => acc + (s.signups?.length || 0), 0); const uniquePlayers = new Set(); const sportRankings = this.data.sports.map(s => { s.signups.forEach(p => uniquePlayers.add(p.email.toLowerCase())); return { id: s.id, name: s.name, icon: s.icon, signupsCount: s.signups.length }; }).sort((a, b) => b.signupsCount - a.signupsCount); return { totalSignups, uniquePlayersCount: uniquePlayers.size, topSport: sportRankings[0] || null, sportRankings }; }
}
export const db = new Database();
