import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';

const SportsContext = createContext(null);

export function SportsProvider({ children }) {
  const { currentUser } = useAuth();
  const [weekType, setWeekType] = useState('next'); // 'next' (subsequent week) or 'current'
  const [sessions, setSessions] = useState([]);
  const [weekInfo, setWeekInfo] = useState(null);
  const [sportsConfig, setSportsConfig] = useState([]);
  const [demoUsers, setDemoUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [sheetConfig, setSheetConfig] = useState({
    webhookUrl: '',
    sheetId: '',
    autoSyncEnabled: true,
    recentLogs: []
  });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch base config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setSportsConfig(data.sports || []);
      setDemoUsers(data.demoUsers || []);
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  }, []);

  // Fetch sessions for active week
  const fetchSessions = useCallback(async (targetWeek = weekType) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sessions?week=${targetWeek}`);
      const data = await res.json();
      setSessions(data.sessions || []);
      setWeekInfo(data.weekInfo || null);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [weekType]);

  // Fetch activity & analytics
  const fetchAuxData = useCallback(async () => {
    try {
      const [actRes, anaRes] = await Promise.all([
        fetch('/api/activity'),
        fetch('/api/analytics')
      ]);
      const actData = await actRes.json();
      const anaData = await anaRes.json();
      setActivities(actData.activities || []);
      setAnalytics(anaData || null);
    } catch (err) {
      console.error('Failed to fetch aux data:', err);
    }
  }, []);

  // Fetch Admin Sheet Config
  const fetchSheetConfig = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      const res = await fetch('/api/admin/sheets/config', {
        headers: { 'x-user-email': currentUser.email }
      });
      if (res.ok) {
        const data = await res.json();
        setSheetConfig(data);
      }
    } catch (err) {
      console.error('Failed to fetch sheet config:', err);
    }
  }, [currentUser]);

  // Initial load
  useEffect(() => {
    fetchConfig();
    fetchSessions(weekType);
    fetchAuxData();
  }, [fetchConfig, fetchSessions, fetchAuxData, weekType]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchSheetConfig();
    }
  }, [currentUser, fetchSheetConfig]);

  // Setup WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws;
    let reconnectTimer;

    const connectWs = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleWebSocketMessage(payload);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimer = setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        setWsConnected(false);
        ws.close();
      };
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  const handleWebSocketMessage = (payload) => {
    const { type, data } = payload;
    
    if (type === 'SESSION_SIGNUP' || type === 'SESSION_CANCEL' || type === 'SESSION_ADMIN_UPDATE') {
      // Update session in-place
      setSessions(prev => prev.map(s => s.id === data.sessionId ? { ...s, ...data.session } : s));
      
      if (data.activity) {
        setActivities(prev => [data.activity, ...prev.slice(0, 49)]);
      }

      // Re-fetch analytics in background
      fetch('/api/analytics').then(r => r.json()).then(setAnalytics).catch(() => {});
    }

    if (type === 'ANNOUNCEMENT_ADDED') {
      setAnnouncements(prev => [data, ...prev]);
      showToast(`📢 Announcement: ${data.title}`, 'info');
    }

    if (type === 'ANNOUNCEMENT_DELETED') {
      setAnnouncements(prev => prev.filter(a => a.id !== data.id));
    }

    if (type === 'ATTENDANCE_UPDATE') {
      setSessions(prev => prev.map(s => {
        if (s.id === data.sessionId) {
          return {
            ...s,
            participants: s.participants.map(p => p.email === data.email ? { ...p, attended: data.attended } : p)
          };
        }
        return s;
      }));
    }
  };

  // Sign up for a sport session
  const signupForSession = async (sessionId) => {
    if (!currentUser) {
      showToast('Please sign in with your @gameopedia.com email first.', 'error');
      return false;
    }

    try {
      const res = await fetch('/api/sessions/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email
        },
        body: JSON.stringify({
          sessionId,
          user: currentUser
        })
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Failed to sign up.', 'error');
        return false;
      }

      // Confetti celebration!
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.75 },
        colors: ['#10b981', '#3b82f6', '#f97316', '#eab308']
      });

      showToast(`🎉 You're in for ${data.session?.sportName}! See you on the court!`, 'success');
      return true;
    } catch (err) {
      showToast('Network error while signing up.', 'error');
      return false;
    }
  };

  // Leave / Cancel sign up
  const cancelSession = async (sessionId) => {
    if (!currentUser) return false;

    try {
      const res = await fetch('/api/sessions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email
        },
        body: JSON.stringify({ sessionId })
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Failed to cancel.', 'error');
        return false;
      }

      showToast(`Left ${data.session?.sportName} session.`, 'info');
      return true;
    } catch (err) {
      showToast('Network error.', 'error');
      return false;
    }
  };

  // Admin: Update Session Venue/Timing
  const updateSessionAdmin = async (sessionId, updates) => {
    if (!currentUser?.email) return false;

    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email
        },
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Failed to update session.', 'error');
        return false;
      }

      showToast('Session venue and timings updated successfully!', 'success');
      return true;
    } catch (err) {
      showToast('Failed to update session.', 'error');
      return false;
    }
  };

  // Admin: Mark Attendance
  const markAttendance = async (sessionId, email, attended) => {
    if (!currentUser?.email) return;

    try {
      await fetch(`/api/admin/sessions/${sessionId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email
        },
        body: JSON.stringify({ email, attended })
      });
    } catch (err) {
      console.error('Attendance error:', err);
    }
  };

  // Admin: Save Google Sheets Configuration
  const saveSheetConfig = async (newConfig) => {
    if (!currentUser?.email) return false;

    try {
      const res = await fetch('/api/admin/sheets/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email
        },
        body: JSON.stringify(newConfig)
      });

      const data = await res.json();
      if (data.success) {
        setSheetConfig(data.config);
        showToast('Google Sheets sync settings saved!', 'success');
        return true;
      }
      return false;
    } catch (err) {
      showToast('Failed to save sheet settings.', 'error');
      return false;
    }
  };

  // Admin: Manual Trigger Sync to Google Sheets
  const triggerGoogleSheetSync = async () => {
    if (!currentUser?.email) return;

    try {
      showToast('🔄 Pushing latest sports roster to Google Sheet...', 'info');
      const res = await fetch('/api/admin/sheets/sync-now', {
        method: 'POST',
        headers: { 'x-user-email': currentUser.email }
      });
      const data = await res.json();
      if (data.success) {
        setSheetConfig(data.config);
        showToast(`✅ Synced with Google Sheet! Status: ${data.log?.status}`, 'success');
      } else {
        showToast(`Sync failed: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast('Error connecting to sync service.', 'error');
    }
  };

  // Download CSV
  const downloadCSV = (targetWeek = weekType) => {
    window.open(`/api/export/csv?week=${targetWeek}`, '_blank');
  };

  return (
    <SportsContext.Provider
      value={{
        weekType,
        setWeekType,
        sessions,
        weekInfo,
        sportsConfig,
        demoUsers,
        announcements,
        activities,
        analytics,
        loading,
        wsConnected,
        sheetConfig,
        toast,
        showToast,
        signupForSession,
        cancelSession,
        updateSessionAdmin,
        markAttendance,
        saveSheetConfig,
        triggerGoogleSheetSync,
        downloadCSV,
        fetchSessions,
        fetchAuxData
      }}
    >
      {children}
    </SportsContext.Provider>
  );
}

export function useSports() {
  const context = useContext(SportsContext);
  if (!context) {
    throw new Error('useSports must be used within a SportsProvider');
  }
  return context;
}
