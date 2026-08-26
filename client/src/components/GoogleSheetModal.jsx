import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSports } from '../context/SportsContext';
import { 
  FileSpreadsheet, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  RefreshCw, 
  Download, 
  ShieldCheck,
  Code
} from 'lucide-react';

export default function GoogleSheetModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { sheetConfig, triggerGoogleSheetSync, downloadCSV, showToast, weekType } = useSports();
  const [scriptCode, setScriptCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser?.email) {
      setLoadingCode(true);
      fetch('/api/admin/sheets/template', {
        headers: { 'x-user-email': currentUser.email }
      })
        .then(r => r.json())
        .then(d => setScriptCode(d.code || ''))
        .catch(() => {})
        .finally(() => setLoadingCode(false));
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    showToast('Apps Script code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-2xl">
              📊
            </div>
            <div>
              <h2 className="text-xl font-black">Google Sheets Live Sync Integration</h2>
              <p className="text-xs text-white/80 mt-0.5">
                Automatically push all employee signups & session rosters to your corporate Google Sheet.
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-200">
          
          {/* Quick Actions Row */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="font-bold text-white text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Live Sync Status: {sheetConfig?.hasWebhook ? '🟢 Connected' : '⚪ Ready to Connect'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {sheetConfig?.hasWebhook 
                  ? 'Signups will auto-sync instantly via webhook.' 
                  : 'Follow the 4 quick steps below to connect your Google Sheet.'}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => downloadCSV(weekType)}
                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>

              <button
                onClick={triggerGoogleSheetSync}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test Sync Now</span>
              </button>
            </div>
          </div>

          {/* 4 Step Setup Guide */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
              Setup Guide (Takes 60 Seconds)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 font-mono">Step 1</span>
                <p className="text-white font-semibold">Open target Google Sheet</p>
                <p className="text-slate-400 text-[11px]">Create a new sheet or open your office Gameopedia Sports Tracker sheet.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 font-mono">Step 2</span>
                <p className="text-white font-semibold">Open Extensions &gt; Apps Script</p>
                <p className="text-slate-400 text-[11px]">Click <em>Extensions</em> from the top menu, then select <em>Apps Script</em>.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 font-mono">Step 3</span>
                <p className="text-white font-semibold">Paste Script Code & Deploy</p>
                <p className="text-slate-400 text-[11px]">Paste the code below into Code.gs, click <em>Deploy</em> &gt; <em>New Deployment</em> &gt; <em>Web app</em> (Access: Anyone).</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 font-mono">Step 4</span>
                <p className="text-white font-semibold">Paste Webhook URL in Admin</p>
                <p className="text-slate-400 text-[11px]">Copy the Web App URL and paste it into the Admin Portal Settings.</p>
              </div>
            </div>
          </div>

          {/* Script Code Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-300">
                <Code className="w-4 h-4 text-teal-400" />
                <span>Google Apps Script Code (Code.gs)</span>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold flex items-center gap-1.5 transition-all border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Code Copied!' : 'Copy Script Code'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed scrollbar-thin">
              {loadingCode ? '// Loading Apps Script code template...' : scriptCode}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
