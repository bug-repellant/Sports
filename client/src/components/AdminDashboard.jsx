import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSports } from '../context/SportsContext';
import { 
  Shield, 
  MapPin, 
  Clock, 
  Calendar, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Bell, 
  Sparkles,
  Link,
  Code,
  Check,
  Save,
  X
} from 'lucide-react';

export default function AdminDashboard({ onOpenSheetModal }) {
  const { currentUser, isAdmin } = useAuth();
  const { 
    sessions, 
    weekInfo, 
    updateSessionAdmin, 
    sheetConfig, 
    saveSheetConfig, 
    triggerGoogleSheetSync, 
    downloadCSV, 
    announcements, 
    demoUsers,
    showToast,
    weekType,
    setWeekType
  } = useSports();

  const [editingSession, setEditingSession] = useState(null);
  const [venueInput, setVenueInput] = useState('');
  const [timingInput, setTimingInput] = useState('');
  const [courtInput, setCourtInput] = useState('');
  const [gearInput, setGearInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [statusInput, setStatusInput] = useState('open');

  // Sheet config local state
  const [webhookUrlInput, setWebhookUrlInput] = useState(sheetConfig?.webhookUrl || '');
  const [sheetIdInput, setSheetIdInput] = useState(sheetConfig?.sheetId || '');
  const [autoSyncState, setAutoSyncState] = useState(sheetConfig?.autoSyncEnabled ?? true);
  const [isSavingSheet, setIsSavingSheet] = useState(false);

  // New announcement state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState('medium');
  const [isPostingAnn, setIsPostingAnn] = useState(false);

  if (!currentUser || !isAdmin) {
    return (
      <div className="p-12 text-center glass-panel rounded-3xl border border-slate-800 space-y-4">
        <Shield className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Admin Privileges Required</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          You need admin access to configure venues, timings, announcements, and Google Sheet sync. You can switch to the Admin profile in the top right user switcher.
        </p>
      </div>
    );
  }

  const handleStartEdit = (session) => {
    setEditingSession(session);
    setVenueInput(session.venue || '');
    setTimingInput(session.timing || '');
    setCourtInput(session.courtType || '');
    setGearInput(session.gearRequired || '');
    setNotesInput(session.notes || '');
    setStatusInput(session.status || 'open');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSession) return;

    await updateSessionAdmin(editingSession.id, {
      venue: venueInput,
      timing: timingInput,
      courtType: courtInput,
      gearRequired: gearInput,
      notes: notesInput,
      status: statusInput
    });

    setEditingSession(null);
  };

  const handleSaveSheetConfig = async (e) => {
    e.preventDefault();
    setIsSavingSheet(true);
    await saveSheetConfig({
      webhookUrl: webhookUrlInput,
      sheetId: sheetIdInput,
      autoSyncEnabled: autoSyncState
    });
    setIsSavingSheet(false);
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    setIsPostingAnn(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email
        },
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          priority: annPriority,
          author: `${currentUser.name} (${currentUser.department})`
        })
      });
      if (res.ok) {
        setAnnTitle('');
        setAnnContent('');
        showToast('Announcement broadcasted to all employees!', 'success');
      }
    } catch {
      showToast('Failed to post announcement.', 'error');
    }
    setIsPostingAnn(false);
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentUser.email }
      });
      showToast('Announcement removed.', 'info');
    } catch {
      showToast('Failed to delete announcement.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Sports Admin Control Center
              </span>
              <span className="text-xs text-slate-400 font-mono">Logged in as {currentUser.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Manage Venues, Timings & Sheets</h1>
            <p className="text-xs text-slate-400 mt-1">
              Finalize court bookings and timings for the subsequent week, broadcast updates, and manage Google Sheets live sync.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCSV(weekType)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={triggerGoogleSheetSync}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Google Sheet Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Google Sheets Integration Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Google Sheets Live Sync Integration
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {sheetConfig?.autoSyncEnabled ? 'Auto-Sync Active' : 'Manual Sync'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pushes player signups, cancellations, and session changes directly into your office Google Sheet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSheetModal}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Code className="w-3.5 h-3.5" />
              <span>View Apps Script Guide</span>
            </button>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSaveSheetConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-2 space-y-1.5">
            <label className="font-bold text-slate-300 uppercase tracking-wider block">
              Google Apps Script Webhook URL (or Service Webhook)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Link className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={webhookUrlInput}
                onChange={(e) => setWebhookUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              When configured, every signup or session modification sends a live JSON payload to this endpoint.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 uppercase tracking-wider block">
              Auto-Sync On Every Signup
            </label>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-700">
              <span className="text-slate-300 font-medium">Automatic Push</span>
              <input
                type="checkbox"
                checked={autoSyncState}
                onChange={(e) => setAutoSyncState(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={isSavingSheet}
              className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 mt-1 flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingSheet ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>

        {/* Recent Sync Audit Log */}
        {sheetConfig?.recentLogs && sheetConfig.recentLogs.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Recent Sync Event Logs
            </span>
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
              {sheetConfig.recentLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                      log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                      log.status === 'SIMULATED' ? 'bg-blue-500/20 text-blue-400' :
                      log.status === 'SKIPPED' ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-slate-300">{log.event}: {log.sport}</span>
                    <span className="text-slate-500">({log.playerName})</span>
                  </div>
                  <span className="text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Venue & Timings Scheduler */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Venue & Timing Scheduling ({weekInfo?.label})
            </h2>
            <p className="text-xs text-slate-400">
              Update venues, addresses, court types, and start/end times for each sport.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekType('next')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                weekType === 'next' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Subsequent Week
            </button>
            <button
              onClick={() => setWeekType('current')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                weekType === 'current' ? 'bg-blue-500 text-white font-bold' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Current Week
            </button>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">Sport</th>
                <th className="pb-3 px-2">Date & Day</th>
                <th className="pb-3 px-2">Timings</th>
                <th className="pb-3 px-2">Venue Location</th>
                <th className="pb-3 px-2">Signups</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-900/50 transition-all">
                  
                  {/* Sport */}
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{session.icon}</span>
                      <div>
                        <p className="font-bold text-white">{session.sportName}</p>
                        <p className="text-[10px] text-slate-400">{session.courtType}</p>
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-2 text-slate-300">
                    <span className="font-semibold text-white">{session.dayName}</span>
                    <span className="block text-[11px] text-slate-500">{session.displayDate}</span>
                  </td>

                  {/* Timings */}
                  <td className="py-3 px-2 font-mono text-amber-300">
                    {session.timing}
                  </td>

                  {/* Venue */}
                  <td className="py-3 px-2 max-w-xs truncate text-slate-300" title={session.venue}>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <strong className="text-white truncate">{session.venue || 'TBD'}</strong>
                    </span>
                  </td>

                  {/* Signups */}
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {session.participants?.length || 0} players
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                      session.status === 'venue_confirmed' ? 'bg-emerald-500/20 text-emerald-300' :
                      session.status === 'open' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {session.status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => handleStartEdit(session)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-[11px] inline-flex items-center gap-1 transition-all border border-slate-700"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Venue/Time</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Office Announcements Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Office Sports Announcements</h2>
              <p className="text-xs text-slate-400">Broadcast important notes, gear alerts, and weather changes to all employees.</p>
            </div>
          </div>
        </div>

        {/* Post Form */}
        <form onSubmit={handlePostAnnouncement} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Announcement headline (e.g., Badminton Court 3 reserved at Star Academy)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <select
                value={annPriority}
                onChange={(e) => setAnnPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none"
              >
                <option value="low">Low Priority (Info)</option>
                <option value="medium">Medium Priority (Important)</option>
                <option value="high">High Priority (Urgent Alert)</option>
              </select>
            </div>
          </div>

          <textarea
            required
            rows={2}
            value={annContent}
            onChange={(e) => setAnnContent(e.target.value)}
            placeholder="Write announcement details..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={isPostingAnn || !annTitle || !annContent}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Announcement</span>
          </button>
        </form>

        {/* Announcements List */}
        <div className="space-y-2 pt-2">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ann.priority === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {ann.priority.toUpperCase()}
                  </span>
                  <h4 className="font-bold text-white">{ann.title}</h4>
                </div>
                <p className="text-slate-300">{ann.content}</p>
                <p className="text-[10px] text-slate-500">By {ann.author} • {new Date(ann.date).toLocaleDateString()}</p>
              </div>

              <button
                onClick={() => handleDeleteAnnouncement(ann.id)}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-4 text-xs">
            <button
              onClick={() => setEditingSession(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="text-3xl">{editingSession.icon}</span>
              <div>
                <h3 className="text-lg font-black text-white">Edit {editingSession.sportName} Details</h3>
                <p className="text-slate-400">{editingSession.dayName}, {editingSession.displayDate}</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Venue & Address
                </label>
                <input
                  type="text"
                  required
                  value={venueInput}
                  onChange={(e) => setVenueInput(e.target.value)}
                  placeholder="e.g. Star Shuttle Academy (Court 1 & 2)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Timings
                  </label>
                  <input
                    type="text"
                    required
                    value={timingInput}
                    onChange={(e) => setTimingInput(e.target.value)}
                    placeholder="e.g. 18:30 – 20:30"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Status
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  >
                    <option value="open">Registration Open</option>
                    <option value="venue_confirmed">Venue Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Court Type / Number
                </label>
                <input
                  type="text"
                  value={courtInput}
                  onChange={(e) => setCourtInput(e.target.value)}
                  placeholder="e.g. Wooden synthetic courts (4 courts reserved)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Gear & Footwear Requirements
                </label>
                <input
                  type="text"
                  value={gearInput}
                  onChange={(e) => setGearInput(e.target.value)}
                  placeholder="e.g. Non-marking shoes compulsory, personal racquets"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Special Notes & Refreshments
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Free energy drinks provided by office"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
