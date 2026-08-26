import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSports } from '../context/SportsContext';
import { Lock, AlertCircle, Sparkles, X, Check, ShieldCheck, Mail } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { loginWithEmail, authError, setAuthError, switchUser, allowedDomain } = useAuth();
  const { demoUsers } = useSports();
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [deptInput, setDeptInput] = useState('Game Engineering');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await loginWithEmail(emailInput, nameInput, deptInput);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const handleSelectDemo = (u) => {
    switchUser(u);
    onClose();
  };

  const isInvalidDomain = emailInput.includes('@') && !emailInput.toLowerCase().endsWith(`@${allowedDomain}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-100 overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Gameopedia Sports Sign-in</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Restricted access: Only verified <span className="text-emerald-400 font-semibold">@{allowedDomain}</span> employees can join office sports.
          </p>
        </div>

        {/* Domain Constraint Warning */}
        {isInvalidDomain && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Invalid Domain:</span> Only email addresses ending with <strong>@{allowedDomain}</strong> are permitted. Personal emails (@gmail, @yahoo, etc.) are blocked.
            </div>
          </div>
        )}

        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setAuthError(null);
                }}
                placeholder={`your.name@${allowedDomain}`}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                  isInvalidDomain 
                    ? 'border-red-500/60 focus:border-red-400' 
                    : 'border-slate-700 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Alex Hunter"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={deptInput}
                onChange={(e) => setDeptInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-sm text-white focus:outline-none"
              >
                <option value="Game Engineering">Game Engineering</option>
                <option value="Game Indexing & Research">Game Indexing & Research</option>
                <option value="Product Strategy">Product Strategy</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="QA & Playtesting">QA & Playtesting</option>
                <option value="DevOps & Infra">DevOps & Infra</option>
                <option value="Data & Analytics">Data & Analytics</option>
                <option value="People Operations">People Operations</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isInvalidDomain || !emailInput}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            <Lock className="w-4 h-4" />
            {isSubmitting ? 'Verifying...' : `Continue to Sports Portal`}
          </button>
        </form>

        {/* Quick Demo Pickers */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Demo Personas
            </span>
            <span className="text-[11px] text-slate-500">1-click login</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {demoUsers.slice(0, 4).map((u) => (
              <button
                key={u.id}
                onClick={() => handleSelectDemo(u)}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-left group"
              >
                <img src={u.avatar} className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700 group-hover:ring-emerald-400" />
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white flex items-center gap-1">
                    {u.name.split(' ')[0]}
                    {u.role === 'admin' && <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded">ADM</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{u.department.split(' ')[0]}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
