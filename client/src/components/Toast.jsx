import React from 'react';
import { useSports } from '../context/SportsContext';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function Toast() {
  const { toast } = useSports();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border text-xs font-semibold max-w-md ${
        toast.type === 'success'
          ? 'bg-slate-900/95 border-emerald-500/50 text-white glow-emerald'
          : toast.type === 'error'
          ? 'bg-slate-900/95 border-rose-500/50 text-rose-200'
          : 'bg-slate-900/95 border-blue-500/50 text-white glow-blue'
      }`}>
        {getIcon()}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
