// api/_db.js - Shared in-memory database for Vercel serverless functions
// NOTE: On Vercel, each function invocation may be a cold start.
// Data is stored in module-level memory. For true persistence,
// connect a free DB like Vercel KV or Neon Postgres.
import crypto from 'crypto';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

const SPORTS_TEMPLATE = [
  { id: 'basketball', name: 'Basketball', icon: '🏀', category: 'Team Sports', image: '/assets/sports/basketball.jpg', gradient: 'from-orange-500 via-amber-500 to-rose-600', tagline: 'High-energy indoor court runs & full pickup games', description: 'Indoor hardwood court with professional hoops. Fast-paced 5v5 scrimmages.', themeColor: '#f97316' },
  { id: 'football', name: 'Football', icon: '⚽', category: 'Team Sports', image: '/assets/sports/football.jpg', gradient: 'from-emerald-500 via-teal-500 to-cyan-600', tagline: '7-a-side floodlit AstroTurf matches', description: 'High-quality synthetic turf arena under floodlights.', themeColor: '#10b981' },
  { id: 'cricket', name: 'Cricket', icon: '🏏', category: 'Team Sports', image: '/assets/sports/cricket.jpg', gradient: 'from-blue-500 via-indigo-500 to-sky-600', tagline: 'Box cricket arena with tennis ball action', description: 'Enclosed turf pitch for fast-paced box cricket.', themeColor: '#3b82f6' },
  { id: 'badminton', name: 'Badminton', icon: '🏸', category: 'Racquet Sports', image: '/assets/sports/badminton.jpg', gradient: 'from-teal-500 via-cyan-500 to-emerald-600', tagline: 'Synthetic indoor courts & doubles rallies', description: 'Professional BWF standard synthetic mat courts.', themeColor: '#14b8a6' },
  { id: 'squash', name: 'Squash', icon: '🎾', category: 'Racquet Sports', image: '/assets/sports/squash.jpg', gradient: 'from-amber-500 via-orange-500 to-yellow-600', tagline: 'Indoor glass-back squash courts', description: 'Enclosed indoor 4-wall squash court with red boundary lines.', themeColor: '#f59e0b' },
  { id: 'pickleball', name: 'Pickleball', icon: '🏓', category: 'Racquet Sports', image: '/assets/sports/pickleball.jpg', gradient: 'from-yellow-500 via-lime-500 to-emerald-600', tagline: 'Outdoor court with paddles & perforated wiffle balls', description: 'Dedicated outdoor pickleball court with composite paddles.', themeColor: '#eab308' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐', category: 'Team Sports', image: '/assets/sports/volleyball.jpg', gradient: 'from-purple-500 via-violet-500 to-indigo-600', tagline: '6v6 indoor & sand court rotation matches', description: 'Indoor cushioned court with standard net.', themeColor: '#8b5cf6' },
];

// Module-level in-memory store (shared across warm invocations)
let store = {
  adminPasswordHash: hashPassword(process.env.ADMIN_PASSWORD || 'gameopedia@admin2026'),
  sheetWebhookUrl: process.env.SHEET_WEBHOOK_URL || '',
  chatWebhookUrl: process.env.CHAT_WEBHOOK_URL || '',
  users: [
    {
      email: 'aravind@gameopedia.com',
      name: 'Aravind',
      passwordHash: hashPassword('admin123'),
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ],
  sports: SPORTS_TEMPLATE.map(s => ({ ...s, venue: 'TBA', timing: 'TBA', signups: [] }))
};

export const db = {
  getSports: () => store.sports,
  getSportById: (id) => store.sports.find(s => s.id === id),
  getStats: () => {
    const totalSignups = store.sports.reduce((a, s) => a + s.signups.length, 0);
    const uniquePlayers = new Set(store.sports.flatMap(s => s.signups.map(p => p.email)));
    const sportRankings = [...store.sports].map(s => ({ id: s.id, name: s.name, icon: s.icon, signupsCount: s.signups.length })).sort((a, b) => b.signupsCount - a.signupsCount);
    return { totalSignups, uniquePlayersCount: uniquePlayers.size, topSport: sportRankings[0] || null, sportRankings };
  },
  getSheetWebhookUrl: () => store.sheetWebhookUrl,
  getChatWebhookUrl: () => store.chatWebhookUrl,
  setSheetWebhookUrl: (url) => { store.sheetWebhookUrl = url; },
  setChatWebhookUrl: (url) => { store.chatWebhookUrl = url; },
  verifyAdminPassword: (password) => {
    if (!password) return false;
    const hash = hashPassword(password);
    return hash === store.adminPasswordHash || password === (process.env.ADMIN_PASSWORD || 'gameopedia@admin2026');
  },
  updateAdminPassword: (newPassword) => {
    if (!newPassword || newPassword.trim().length < 4) throw new Error('Password must be at least 4 characters.');
    store.adminPasswordHash = hashPassword(newPassword);
    return true;
  },
  registerUser: (email, password, customName) => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = store.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) throw new Error('An account with this email already exists. Please log in.');
    const name = customName || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const role = cleanEmail === 'aravind@gameopedia.com' ? 'admin' : 'user';
    const user = { email: cleanEmail, name, passwordHash: hashPassword(password), role, createdAt: new Date().toISOString() };
    store.users.push(user);
    const token = Buffer.from(`${user.email}:${Date.now()}`).toString('base64');
    return { user: { email: user.email, name: user.name, role: user.role }, token };
  },
  loginUser: (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = store.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) return db.registerUser(email, password);
    const inputHash = hashPassword(password);
    if (user.passwordHash !== inputHash) throw new Error('Incorrect password. Please try again.');
    const token = Buffer.from(`${user.email}:${Date.now()}`).toString('base64');
    return { user: { email: user.email, name: user.name, role: user.role }, token };
  },
  signup: (sportId, { name, email }) => {
    const sport = db.getSportById(sportId);
    if (!sport) throw new Error('Sport not found');
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split('@')[0]).trim();
    const existing = sport.signups.find(p => p.email.toLowerCase() === cleanEmail);
    if (existing) return { sport, isNew: false };
    sport.signups.push({ name: cleanName, email: cleanEmail, signedUpAt: new Date().toISOString() });
    return { sport, isNew: true };
  },
  cancelSignup: (sportId, email) => {
    const sport = db.getSportById(sportId);
    if (!sport) throw new Error('Sport not found');
    const cleanEmail = email.trim().toLowerCase();
    const idx = sport.signups.findIndex(p => p.email.toLowerCase() === cleanEmail);
    if (idx === -1) return { sport, removed: false };
    sport.signups.splice(idx, 1);
    return { sport, removed: true };
  },
  updateVenueTiming: (sportId, { venue, timing }) => {
    const sport = db.getSportById(sportId);
    if (!sport) throw new Error('Sport not found');
    if (venue !== undefined) sport.venue = venue.trim() || 'TBA';
    if (timing !== undefined) sport.timing = timing.trim() || 'TBA';
    return sport;
  },
  clearAllSignups: () => {
    store.sports.forEach(s => { s.signups = []; s.venue = 'TBA'; s.timing = 'TBA'; });
    return store.sports;
  }
};

export function isGameopediaEmail(email) {
  return typeof email === 'string' && email.trim().toLowerCase().endsWith('@gameopedia.com');
}

export function getNextWeekSignupInfo() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);

  const thisfriday = new Date(now);
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  thisfriday.setDate(now.getDate() + (daysUntilFriday === 0 ? 0 : daysUntilFriday));
  thisfriday.setHours(18, 0, 0, 0);

  const isSignupOpen = now < thisfriday;

  const year = nextMonday.getFullYear();
  const weekId = `${year}-W${String(Math.ceil((nextMonday - new Date(year, 0, 1)) / 604800000 + 1)).padStart(2, '0')}`;

  return {
    weekId,
    label: `Week of ${nextMonday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
    isSignupOpen,
    fridayDeadlineDisplay: thisfried?.toLocaleDateString?.('en-IN', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) || 'Friday 6:00 PM'
  };
}
