import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSports } from '../context/SportsContext';
import { 
  Trophy, 
  Calendar, 
  UserCheck, 
  BarChart3, 
  Activity, 
  Shield, 
  ChevronDown, 
  LogOut, 
  Radio,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Lock
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSheetModal }) {
  const { currentUser, isAdmin, switchUser, logout, setIsAuthModalOpen } = useAuth();
  const { demoUsers, wsConnected, sessions } = useSports();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Count user signups for next week
  const mySignupsCount = sessions.filter(s => 
    s.participants?.some(p => p.email?.toLowerCase() === currentUser?.email?.toLowerCase())
  ).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('schedule')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-xl">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  GAMEOPEDIA <span className="text-emerald-400 font-medium">SPORTS</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800/90 text-emerald-400 border border-emerald-500/30">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  @gameopedia.com
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Office Sports Club & Next-Week Signup Portal</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'schedule'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Signups
            </button>

            <button
              onClick={() => setActiveTab('mysignups')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === 'mysignups'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              My Signups
              {mySignupsCount > 0 && (
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {mySignupsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Leaderboard
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'activity'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              Activity
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400" />
              Admin Portal
              {isAdmin && (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                  ADMIN
                </span>
              )}
            </button>
          </nav>

          {/* Right Controls: Live Socket Status & Profile Switcher */}
          <div className="flex items-center gap-3">
            {/* Live Socket Status */}
            <div 
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs"
              title={wsConnected ? "Real-time updates active via WebSockets" : "Connecting to live feed..."}
            >
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 live-dot' : 'bg-amber-400'}`}></span>
              <span className="text-slate-400 text-[11px] font-medium">
                {wsConnected ? 'Live Sync' : 'Connecting'}
              </span>
            </div>

            {/* Google Sheets Quick Button */}
            <button
              onClick={onOpenSheetModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all hover:scale-105"
              title="Google Sheets Live Integration"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Sheets Sync</span>
            </button>

            {/* User Profile / Switcher Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 transition-all"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-400"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                      {currentUser.name}
                      {isAdmin && <span className="text-[9px] text-amber-400 font-bold bg-amber-950/60 px-1 py-0.2 rounded border border-amber-600/30">ADMIN</span>}
                    </p>
                    <p className="text-[10px] text-slate-400">{currentUser.department}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                      <div className="p-3 border-b border-slate-800 bg-slate-950/60 rounded-xl mb-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500"
                          />
                          <div>
                            <p className="font-bold text-slate-100 text-sm">{currentUser.name}</p>
                            <p className="text-slate-400 text-[11px]">{currentUser.email}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {currentUser.department}
                              </span>
                              {isAdmin && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Sports Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Switch Colleague quick selector */}
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Switch Persona (Demo/Test)</span>
                        <Sparkles className="w-3 h-3 text-amber-400" />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 my-1 pr-1">
                        {demoUsers.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchUser(u);
                              setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                              u.email === currentUser.email
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                                : 'hover:bg-slate-800/80 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <img src={u.avatar} className="w-6 h-6 rounded-full object-cover" />
                              <div>
                                <p className="text-xs">{u.name}</p>
                                <p className="text-[10px] text-slate-400">{u.department}</p>
                              </div>
                            </div>
                            {u.role === 'admin' ? (
                              <span className="text-[9px] text-amber-400 font-bold bg-amber-950/60 px-1 py-0.5 rounded border border-amber-500/30">ADMIN</span>
                            ) : (
                              u.email === currentUser.email && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-slate-800 pt-2 mt-1 space-y-1">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setIsAuthModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-xs font-medium"
                        >
                          <Lock className="w-3.5 h-3.5 text-emerald-400" />
                          Log in with custom @gameopedia.com
                        </button>
                        
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-xs font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
              >
                Sign In (@gameopedia.com)
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
              activeTab === 'schedule' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Signups
          </button>
          <button
            onClick={() => setActiveTab('mysignups')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
              activeTab === 'mysignups' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            My Signups
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
              activeTab === 'analytics' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Stats
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
              activeTab === 'activity' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Live
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
              activeTab === 'admin' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Admin
          </button>
        </div>
      </div>
    </header>
  );
}
