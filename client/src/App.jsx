import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Lock, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  FileSpreadsheet, 
  Download, 
  Edit3, 
  Save, 
  X, 
  User, 
  Mail, 
  AlertCircle,
  Copy,
  Check,
  Calendar,
  Sparkles,
  TrendingUp,
  Flame,
  MessageSquare,
  CalendarPlus,
  Send,
  Shield,
  ShieldCheck,
  Users,
  KeyRound,
  LogOut,
  ChevronRight,
  UserCheck,
  Info,
  Layers,
  Activity,
  BarChart3,
  CalendarDays,
  Award,
  Zap,
  Filter
} from 'lucide-react';

const ALLOWED_DOMAIN = 'gameopedia.com';

const DEMO_PROFILES = [
  { name: 'Aravind', email: 'aravind@gameopedia.com', password: 'admin123' },
  { name: 'Sarah Jenkins', email: 'sarah.jenkins@gameopedia.com', password: 'password123' },
  { name: 'Marcus Chen', email: 'marcus.chen@gameopedia.com', password: 'password123' },
  { name: 'Priya Sharma', email: 'priya.sharma@gameopedia.com', password: 'password123' }
];

export default function App() {
  // Mouse position for interactive background spotlight
  const [mousePos, setMousePos] = useState({ x: 500, y: 300 });

  // Auto-recognized User
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gameopedia_user_profile');
      return saved ? JSON.parse(saved) : DEMO_PROFILES[0];
    } catch {
      return DEMO_PROFILES[0];
    }
  });

  const [userToken, setUserToken] = useState(() => {
    return localStorage.getItem('gameopedia_user_token') || btoa('aravind@gameopedia.com:session');
  });

  // Admin Master Password Session
  const [adminToken, setAdminToken] = useState(() => {
    return localStorage.getItem('gameopedia_admin_token') || '';
  });

  // Active Dashboard View Tab
  const [activeTab, setActiveTab] = useState('arena'); // 'arena', 'schedule', 'analytics'
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Dialog States
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [switchError, setSwitchError] = useState('');
  const [isSwitchingLoading, setIsSwitchingLoading] = useState(false);

  // Admin Password Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminVerifying, setIsAdminVerifying] = useState(false);

  // App Data
  const [sports, setSports] = useState([]);
  const [weekInfo, setWeekInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [sheetWebhookUrl, setSheetWebhookUrl] = useState('');
  const [chatWebhookUrl, setChatWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Admin In-line Editing
  const [editingSportId, setEditingSportId] = useState(null);
  const [editVenue, setEditVenue] = useState('');
  const [editTiming, setEditTiming] = useState('');
  const [isSendingChat, setIsSendingChat] = useState({});

  // Apps Script Guide Modal
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptCode, setScriptCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const showToastMsg = (msg, type = 'success') => {
    setToast({ id: Date.now(), msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load sports data
  const loadData = async () => {
    try {
      const res = await fetch('/api/sports');
      const data = await res.json();
      setSports(data.sports || []);
      setWeekInfo(data.weekInfo || null);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Error fetching sports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!currentUser) {
      const defaultUser = DEMO_PROFILES[0];
      setCurrentUser(defaultUser);
      setUserToken(btoa(`${defaultUser.email}:session`));
      localStorage.setItem('gameopedia_user_profile', JSON.stringify(defaultUser));
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'SPORTS_UPDATED') {
          if (payload.data.sports) setSports(payload.data.sports);
          if (payload.data.stats) setStats(payload.data.stats);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      ws.close();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Account switching
  const handleSelectProfile = async (profile) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, password: profile.password })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setUserToken(data.token);
        localStorage.setItem('gameopedia_user_profile', JSON.stringify(data.user));
        localStorage.setItem('gameopedia_user_token', data.token);
        setShowSwitchModal(false);
        showToastMsg(`Switched account to ${data.user.name}`, 'info');
      }
    } catch {
      setCurrentUser(profile);
      setShowSwitchModal(false);
      showToastMsg(`Active as ${profile.name}`, 'info');
    }
  };

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    setSwitchError('');
    setIsSwitchingLoading(true);

    const emailClean = customEmailInput.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailClean, password: customPasswordInput })
      });
      const data = await res.json();
      if (!data.success) {
        setSwitchError(data.error || 'Login failed.');
        setIsSwitchingLoading(false);
        return;
      }

      setCurrentUser(data.user);
      setUserToken(data.token);
      localStorage.setItem('gameopedia_user_profile', JSON.stringify(data.user));
      localStorage.setItem('gameopedia_user_token', data.token);
      setShowSwitchModal(false);
      setCustomPasswordInput('');
      showToastMsg(`Welcome, ${data.user.name}!`, 'success');
    } catch {
      setSwitchError('Connection error.');
    } finally {
      setIsSwitchingLoading(false);
    }
  };

  // Admin Master Password Verification
  const handleAdminVerify = async (e) => {
    e.preventDefault();
    setAdminError('');
    setIsAdminVerifying(true);

    try {
      const res = await fetch('/api/auth/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput })
      });

      const data = await res.json();
      if (!data.success) {
        setAdminError(data.error || 'Incorrect admin password.');
        setIsAdminVerifying(false);
        return;
      }

      setAdminToken(data.adminToken);
      localStorage.setItem('gameopedia_admin_token', data.adminToken);
      if (data.sheetWebhookUrl) setSheetWebhookUrl(data.sheetWebhookUrl);
      if (data.chatWebhookUrl) setChatWebhookUrl(data.chatWebhookUrl);

      setShowAdminModal(false);
      setAdminPasswordInput('');
      showToastMsg('🛡️ Admin Controls Unlocked!', 'success');
    } catch {
      setAdminError('Failed to verify admin password.');
    } finally {
      setIsAdminVerifying(false);
    }
  };

  const handleAdminLock = () => {
    setAdminToken('');
    localStorage.removeItem('gameopedia_admin_token');
    showToastMsg('Admin mode locked.', 'info');
  };

  // 1-Click Sign Up / Cancel with Confetti & Instant Google Sheets Push
  const handleToggleSignup = async (sport) => {
    if (!currentUser) return;

    const isSignedUp = sport.signups?.some(
      p => p.email.toLowerCase() === currentUser.email.toLowerCase()
    );

    try {
      if (isSignedUp) {
        const res = await fetch('/api/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sportId: sport.id,
            email: currentUser.email,
            userToken
          })
        });
        const data = await res.json();
        if (data.success) {
          showToastMsg(`Removed from ${sport.name}. Synced to Google Sheets!`, 'info');
        } else {
          showToastMsg(data.error || 'Failed to cancel', 'error');
        }
      } else {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sportId: sport.id,
            email: currentUser.email,
            name: currentUser.name,
            userToken
          })
        });
        const data = await res.json();
        if (data.success) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.75 },
            colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899']
          });
          showToastMsg(`🎉 You signed up for ${sport.name}! Synced to Google Sheets!`, 'success');
        } else {
          showToastMsg(data.error || 'Failed to sign up', 'error');
        }
      }
      loadData();
    } catch {
      showToastMsg('Network error while signing up', 'error');
    }
  };

  // Admin: Save Venue & Timing
  const handleSaveVenueTiming = async (sportId) => {
    if (!adminToken) {
      setShowAdminModal(true);
      return;
    }

    try {
      const res = await fetch(`/api/admin/sport/${sportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venue: editVenue, timing: editTiming, adminToken })
      });
      if (res.ok) {
        setEditingSportId(null);
        showToastMsg('Venue and timing finalized!', 'success');
        loadData();
      }
    } catch {
      showToastMsg('Failed to update venue/timing', 'error');
    }
  };

  // Admin: Broadcast to Google Chat
  const handleBroadcastGoogleChat = async (sport) => {
    if (!adminToken) {
      setShowAdminModal(true);
      return;
    }

    setIsSendingChat(prev => ({ ...prev, [sport.id]: true }));
    try {
      const res = await fetch(`/api/admin/google-chat/broadcast/${sport.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`📢 Broadcast sent to Google Chat for ${sport.name}!`, 'success');
      } else {
        showToastMsg(data.error || 'Google Chat broadcast failed. Check Webhook URL in Admin Settings.', 'error');
      }
    } catch {
      showToastMsg('Error sending Google Chat notification', 'error');
    } finally {
      setIsSendingChat(prev => ({ ...prev, [sport.id]: false }));
    }
  };

  // Google Calendar Batch Invite
  const handleOpenGCalWithAttendees = async (sport) => {
    try {
      const res = await fetch(`/api/calendar/gcal-url/${sport.id}`);
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
        showToastMsg('Opening Google Calendar with attendees added to guest list...', 'info');
      }
    } catch {
      showToastMsg('Failed to generate calendar invite', 'error');
    }
  };

  // Admin: Save Integrations
  const handleSaveIntegrations = async (e) => {
    e.preventDefault();
    if (!adminToken) {
      setShowAdminModal(true);
      return;
    }

    try {
      const res = await fetch('/api/admin/integrations/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetWebhookUrl, chatWebhookUrl, adminToken })
      });
      if (res.ok) {
        showToastMsg('Webhook URLs saved! Live sync active.', 'success');
      }
    } catch {
      showToastMsg('Failed to save settings', 'error');
    }
  };

  const handleOpenAppsScript = async () => {
    try {
      const res = await fetch('/api/admin/sheets/template');
      const data = await res.json();
      setScriptCode(data.code || '');
      setShowScriptModal(true);
    } catch {
      showToastMsg('Failed to load template', 'error');
    }
  };

  // Filtered sports list
  const filteredSports = useMemo(() => {
    if (selectedCategory === 'All') return sports;
    if (selectedCategory === 'Trending') {
      return [...sports].sort((a, b) => (b.signups?.length || 0) - (a.signups?.length || 0));
    }
    if (selectedCategory === 'My Signups') {
      return sports.filter(s => s.signups?.some(p => p.email.toLowerCase() === currentUser?.email?.toLowerCase()));
    }
    return sports.filter(s => s.category === selectedCategory);
  }, [sports, selectedCategory, currentUser]);

  // Aggregate user leaderboard
  const playerLeaderboard = useMemo(() => {
    const counts = {};
    sports.forEach(s => {
      s.signups?.forEach(p => {
        const key = p.name || p.email;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [sports]);

  const maxSportSignups = Math.max(...(stats?.sportRankings?.map(s => s.signupsCount) || [1]), 1);

  return (
    <div className="relative min-h-screen bg-[#060911] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black overflow-hidden bg-grid-pattern">
      
      {/* 🌟 Dynamic Interactive Spotlight & Ambient Mesh Glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 opacity-60"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.08), transparent 80%)`
        }}
      />
      <div className="pointer-events-none fixed top-10 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl animate-orb-1" />
      <div className="pointer-events-none fixed bottom-10 right-1/4 w-[30rem] h-[30rem] rounded-full bg-blue-600/10 blur-3xl animate-orb-2" />
      <div className="pointer-events-none fixed top-1/2 right-10 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl animate-orb-3" />

      {/* Main Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        
        {/* Top Navbar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-600 flex items-center justify-center text-2xl shadow-xl shadow-emerald-500/20 font-black shrink-0">
              ⚽
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                GAMEOPEDIA <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">SPORTS</span>
              </h1>
              <p className="text-xs text-slate-400">Office Weekly Sports Signups & Roster Sync</p>
            </div>
          </div>

          {/* Right Controls: User Profile & Admin Mode */}
          <div className="flex items-center gap-3">
            
            {/* Admin Key Button */}
            <button
              onClick={() => adminToken ? handleAdminLock() : setShowAdminModal(true)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm ${
                adminToken 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 glow-amber' 
                  : 'glass-panel text-slate-400 hover:text-white border-white/10 hover:border-white/20'
              }`}
              title={adminToken ? "Admin Mode Active (Click to Lock)" : "Unlock Admin Controls with Password"}
            >
              {adminToken ? <ShieldCheck className="w-4 h-4 text-amber-400" /> : <KeyRound className="w-4 h-4" />}
              <span>{adminToken ? 'Admin Mode' : 'Admin'}</span>
            </button>

            {/* Recognized User Bar */}
            {currentUser && (
              <div 
                onClick={() => setShowSwitchModal(true)}
                className="flex items-center gap-3 glass-panel hover:border-emerald-500/40 pl-3 pr-3.5 py-1.5 rounded-2xl text-xs cursor-pointer transition-all group"
                title="Browser profile recognized. Click to switch account."
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left">
                  <span className="font-bold text-white text-xs block leading-tight group-hover:text-emerald-300 transition-colors">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono leading-none block">
                    {currentUser.email}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            )}
          </div>
        </header>

        {/* 🚀 Hero Interactive Dashboard & Live KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* KPI 1: Week Signup Window & Friday 6 PM Cutoff */}
          <div className="md:col-span-2 p-5 rounded-3xl glass-card relative overflow-hidden flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-300">Registration Window</span>
              </div>
              {weekInfo?.isSignupOpen ? (
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
                  Signups Active
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/40">
                  Signups Closed
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {weekInfo?.label || 'Next Week Matches'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Signups close strictly by <strong>6:00 PM this Friday</strong> ({weekInfo?.fridayDeadlineDisplay})
              </p>
            </div>
          </div>

          {/* KPI 2: Total Signups */}
          <div className="p-5 rounded-3xl glass-card flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Total Signups</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-4 h-4" />
              </span>
            </div>
            <div>
              <span className="text-3xl font-black text-white">{stats?.totalSignups || 0}</span>
              <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">Live Roster Spots</p>
            </div>
          </div>

          {/* KPI 3: Unique Athletes */}
          <div className="p-5 rounded-3xl glass-card flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Active Athletes</span>
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div>
              <span className="text-3xl font-black text-white">{stats?.uniquePlayersCount || 0}</span>
              <p className="text-[11px] text-blue-400 font-semibold mt-0.5">Colleagues Participating</p>
            </div>
          </div>

        </div>

        {/* 🎛️ Interactive View Switcher Tabs (Arena, Schedule, Analytics) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-panel">
            <button
              onClick={() => setActiveTab('arena')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'arena' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Sports Arena</span>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'schedule' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Weekly Timetable</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'analytics' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Leaderboard & Stats</span>
            </button>
          </div>

          {/* Arena Category Filters (Only when on Arena tab) */}
          {activeTab === 'arena' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Trending', 'Racquet Sports', 'Team Sports', 'My Signups'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {cat === 'Trending' ? '🔥 Trending' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 🎴 TAB 1: SPORTS ARENA (Interactive Media Grid) */}
        {activeTab === 'arena' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 p-16 text-center text-slate-500 text-xs">Loading sports arena...</div>
              ) : filteredSports.length === 0 ? (
                <div className="col-span-2 p-16 text-center text-slate-400 glass-card rounded-3xl space-y-2">
                  <p className="text-sm font-bold">No sports match this filter.</p>
                  <button 
                    onClick={() => setSelectedCategory('All')} 
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 text-black font-bold text-xs"
                  >
                    View All Sports
                  </button>
                </div>
              ) : (
                filteredSports.map((sport) => {
                  const isSignedUp = sport.signups?.some(
                    p => p.email.toLowerCase() === currentUser?.email?.toLowerCase()
                  );
                  const isEditingThis = editingSportId === sport.id;
                  const hasAttendees = sport.signups && sport.signups.length > 0;

                  return (
                    <div
                      key={sport.id}
                      className={`group relative rounded-3xl overflow-hidden glass-card transition-all duration-300 flex flex-col justify-between ${
                        isSignedUp 
                          ? 'border-emerald-500/60 ring-1 ring-emerald-500/40 bg-emerald-950/20' 
                          : 'border-white/10 hover:border-emerald-500/40'
                      }`}
                    >
                      {/* Prominent High-Resolution Sports Media Banner */}
                      <div className="relative h-48 sm:h-52 w-full overflow-hidden">
                        <img 
                          src={sport.image} 
                          alt={sport.name}
                          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1321] via-[#0d1321]/40 to-transparent" />
                        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${sport.gradient || 'from-emerald-500 to-teal-500'}`} />

                        {/* Top Badges */}
                        <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-md">
                            {sport.defaultDay}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                            {sport.category}
                          </span>
                        </div>

                        {/* Bottom Title & Icon Overlay */}
                        <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-xl shrink-0 group-hover:scale-105 transition-transform">
                              {sport.icon}
                            </div>
                            <div>
                              <h3 className="font-black text-xl text-white tracking-tight drop-shadow-md">
                                {sport.name}
                              </h3>
                              <p className="text-[11px] text-slate-300 drop-shadow-sm font-medium">
                                {sport.tagline}
                              </p>
                            </div>
                          </div>

                          {isSignedUp && (
                            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 shrink-0">
                              YOU'RE IN
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content & Details */}
                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        
                        <div className="space-y-3">
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {sport.description}
                          </p>

                          {/* Venue & Timing Row / In-line Editor */}
                          {isEditingThis ? (
                            <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2 text-xs">
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5 font-bold">Venue</label>
                                <input
                                  type="text"
                                  value={editVenue}
                                  onChange={(e) => setEditVenue(e.target.value)}
                                  placeholder="e.g. PlayArena Court 2"
                                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5 font-bold">Timing</label>
                                <input
                                  type="text"
                                  value={editTiming}
                                  onChange={(e) => setEditTiming(e.target.value)}
                                  placeholder="e.g. 18:30 - 20:30"
                                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                                />
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => handleSaveVenueTiming(sport.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs shadow-md"
                                >
                                  Save Details
                                </button>
                                <button
                                  onClick={() => setEditingSportId(null)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-0.5">
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  <MapPin className="w-3 h-3 text-rose-400" />
                                  <span>Venue</span>
                                </div>
                                <span className={`font-bold block truncate ${sport.venue && sport.venue !== 'TBA' ? 'text-white' : 'text-amber-400'}`}>
                                  {sport.venue || 'TBA'}
                                </span>
                              </div>

                              <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-0.5">
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Timing</span>
                                </div>
                                <span className={`font-bold block truncate ${sport.timing && sport.timing !== 'TBA' ? 'text-white' : 'text-amber-400'}`}>
                                  {sport.timing || 'TBA'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Registered Attendees Roster */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-semibold flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Roster: {sport.signups?.length || 0} Registered</span>
                              </span>
                            </div>

                            {hasAttendees ? (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                {sport.signups.map((p) => (
                                  <span
                                    key={p.email}
                                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                                      p.email.toLowerCase() === currentUser?.email?.toLowerCase()
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                                        : 'bg-slate-900 text-slate-300 border border-white/5'
                                    }`}
                                  >
                                    {p.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 italic">No players signed up yet. Be the first!</p>
                            )}
                          </div>
                        </div>

                        {/* 1-Click Action Button */}
                        <div className="pt-2 border-t border-white/10 space-y-3">
                          <button
                            onClick={() => handleToggleSignup(sport)}
                            disabled={!weekInfo?.isSignupOpen}
                            className={`w-full py-3 rounded-2xl font-black text-xs transition-all shadow-xl flex items-center justify-center gap-2 ${
                              !weekInfo?.isSignupOpen
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : isSignedUp
                                ? 'bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                          >
                            {isSignedUp ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Signed Up (Click to Leave)</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 fill-current" />
                                <span>Join Next Week Roster</span>
                              </>
                            )}
                          </button>

                          {/* 🛡️ ADMIN ACTIONS */}
                          {adminToken && (
                            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                                <Shield className="w-3.5 h-3.5" />
                                <span>Admin:</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingSportId(sport.id);
                                    setEditVenue(sport.venue || 'TBA');
                                    setEditTiming(sport.timing || 'TBA');
                                  }}
                                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  onClick={() => handleBroadcastGoogleChat(sport)}
                                  disabled={isSendingChat[sport.id]}
                                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                                  title="Broadcast to Google Chat Space"
                                >
                                  <Send className="w-3 h-3 text-emerald-400" />
                                  <span>{isSendingChat[sport.id] ? '...' : 'Chat Alert'}</span>
                                </button>

                                <button
                                  onClick={() => handleOpenGCalWithAttendees(sport)}
                                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                                  title="Open Google Calendar with all attendees added to guest list"
                                >
                                  <CalendarPlus className="w-3 h-3 text-blue-400" />
                                  <span>GCal</span>
                                </button>

                                <a
                                  href={`/api/calendar/export/${sport.id}`}
                                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 text-[11px] transition-all"
                                  title="Download .ics invite"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          )}

                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 📅 TAB 2: WEEKLY TIMETABLE MATRIX */}
        {activeTab === 'schedule' && (
          <div className="p-6 rounded-3xl glass-card space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-400" />
                  <span>Next Week Schedule & Match Days</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Overview of scheduled day, timing, and attendance for each sport</p>
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {sports.map((sport) => {
                const isSignedUp = sport.signups?.some(
                  p => p.email.toLowerCase() === currentUser?.email?.toLowerCase()
                );

                return (
                  <div key={sport.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-xl shrink-0">
                        {sport.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm">{sport.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300">
                            {sport.defaultDay}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Venue: <strong className="text-slate-200">{sport.venue || 'TBA'}</strong> • Time: <strong className="text-slate-200">{sport.timing || 'TBA'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-emerald-400 font-bold">
                        👥 {sport.signups?.length || 0} players
                      </span>
                      <button
                        onClick={() => handleToggleSignup(sport)}
                        className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${
                          isSignedUp
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        }`}
                      >
                        {isSignedUp ? 'Cancel' : 'Sign Up'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 📊 TAB 3: LEADERBOARD & STATS DASHBOARD */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            
            {/* Sports Popularity Chart */}
            <div className="p-6 rounded-3xl glass-card space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Flame className="w-5 h-5 text-orange-400" />
                <h3 className="font-black text-white text-sm">Sports Popularity Leaderboard</h3>
              </div>

              <div className="space-y-3">
                {stats?.sportRankings?.map((sr) => {
                  const percentage = Math.round((sr.signupsCount / maxSportSignups) * 100);
                  return (
                    <div key={sr.id} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-2">
                          <span>{sr.icon}</span>
                          <span>{sr.name}</span>
                        </span>
                        <span className="text-emerald-400 font-black">{sr.signupsCount} players</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Office Athletes Community */}
            <div className="p-6 rounded-3xl glass-card space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-sm">Top Office Athletes</h3>
              </div>

              {playerLeaderboard.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No signups yet this week.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {playerLeaderboard.map((player, idx) => (
                    <div key={player.name} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-white/5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                          idx === 0 ? 'bg-amber-500 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white">{player.name}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/20 text-[11px]">
                        {player.count} {player.count === 1 ? 'sport' : 'sports'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 🛡️ ADMIN GOOGLE SHEETS & WEBHOOK CONTROLS (STRICTLY PASSWORD PROTECTED) */}
        {adminToken && (
          <div className="p-6 sm:p-7 rounded-3xl glass-card border-amber-500/40 shadow-2xl space-y-5 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">
                    Admin Integration Hub & Google Sheets
                  </h3>
                  <p className="text-[11px] text-slate-400">Manage real-time spreadsheet tracking and Google Chat alerts</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenAppsScript}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold transition-all"
                >
                  Apps Script Setup
                </button>
                <a
                  href="/api/export/csv"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 font-bold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </a>
              </div>
            </div>

            <form onSubmit={handleSaveIntegrations} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    Google Sheets Webhook URL (Live Auto-Sync)
                  </label>
                  <input
                    type="url"
                    value={sheetWebhookUrl}
                    onChange={(e) => setSheetWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Every signup and cancellation is dispatched instantly to your Google Sheet.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    Google Chat Webhook URL (Space Notifications)
                  </label>
                  <input
                    type="url"
                    value={chatWebhookUrl}
                    onChange={(e) => setChatWebhookUrl(e.target.value)}
                    placeholder="https://chat.googleapis.com/v1/spaces/.../messages?key=..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Posts confirmed rosters and venue timings to your Google Chat space.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  {sheetWebhookUrl ? '🟢 Live Google Sheets Sync Active' : '⚪ Webhook optional — CSV export always available'}
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black transition-all shadow-lg shadow-amber-500/20"
                >
                  Save Integration Settings
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* 🔄 BROWSER ACCOUNT SWITCHER MODAL */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md p-6 rounded-3xl glass-panel shadow-2xl space-y-4 text-xs">
            <button
              onClick={() => setShowSwitchModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">Browser Account Identity</h3>
              </div>
              <p className="text-xs text-slate-400">
                Currently recognized as <strong className="text-white">{currentUser?.name}</strong> ({currentUser?.email})
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Switch Detected Profile:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_PROFILES.map((dp) => (
                  <button
                    key={dp.email}
                    type="button"
                    onClick={() => handleSelectProfile(dp)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      dp.email === currentUser?.email
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                        : 'bg-slate-950 hover:bg-slate-800 border-white/5 text-slate-300'
                    }`}
                  >
                    <span className="block text-xs font-bold truncate">{dp.name}</span>
                    <span className="block text-[10px] text-slate-500 font-mono truncate">{dp.email}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Or Sign in with another email:
              </span>

              {switchError && (
                <p className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {switchError}
                </p>
              )}

              <form onSubmit={handleCustomLogin} className="space-y-2">
                <input
                  type="email"
                  required
                  value={customEmailInput}
                  onChange={(e) => setCustomEmailInput(e.target.value)}
                  placeholder="your.name@gameopedia.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="password"
                  required
                  value={customPasswordInput}
                  onChange={(e) => setCustomPasswordInput(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isSwitchingLoading}
                  className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all"
                >
                  {isSwitchingLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ ADMIN PASSWORD MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm p-6 rounded-3xl glass-panel border-amber-500/40 shadow-2xl space-y-4 text-xs">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">Admin Master Password</h3>
              <p className="text-xs text-slate-400">
                Enter admin password to manage venues, webhooks, and integrations.
              </p>
            </div>

            {adminError && (
              <p className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {adminError}
              </p>
            )}

            <form onSubmit={handleAdminVerify} className="space-y-3">
              <div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Admin password (e.g. gameopedia@admin2026)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">Default: <code>gameopedia@admin2026</code> or <code>admin123</code></p>
              </div>

              <button
                type="submit"
                disabled={isAdminVerifying || !adminPasswordInput}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all disabled:opacity-50"
              >
                {isAdminVerifying ? 'Verifying...' : 'Unlock Admin Controls'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Apps Script Guide Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl p-6 rounded-3xl glass-panel space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                Google Apps Script (30-Second Setup)
              </h3>
              <button onClick={() => setShowScriptModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Open your Google Sheet &gt; <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.</li>
              <li>Replace code in Code.gs with the snippet below.</li>
              <li>Click <strong>Deploy</strong> &gt; <strong>New Deployment</strong> &gt; <strong>Web app</strong> (Access: <em>Anyone</em>).</li>
              <li>Paste the Web App URL in the Admin Settings box.</li>
            </ol>

            <div className="relative">
              <pre className="p-3 rounded-xl bg-slate-950 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-48 border border-white/10">
                {scriptCode}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(scriptCode);
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 2000);
                }}
                className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1"
              >
                {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{codeCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowScriptModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 🌟 ANIMATED TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl border text-xs font-semibold max-w-md ${
            toast.type === 'error'
              ? 'bg-slate-900/95 border-rose-500/60 text-rose-200 shadow-rose-500/20'
              : toast.type === 'info'
              ? 'bg-slate-900/95 border-blue-500/60 text-blue-200 glow-blue'
              : 'bg-slate-900/95 border-emerald-500/60 text-emerald-200 glow-emerald'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

    </div>
  );
}
