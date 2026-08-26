import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const GOOGLE_CLIENT_ID = '434952931282-0pnmfsskbrkq3ha0gl8oo3lhn2i5jqha.apps.googleusercontent.com'

const repairLoadDataPlugin = {
  name: 'sports-production-fixes',
  enforce: 'pre',
  transform(code, id) {
    if (!id.endsWith('/client/src/App.jsx')) return null

    const marker = '  const showToastMsg = (msg, type = \'success\') => {'
    if (!code.includes(marker)) return null

    const loadData = `  const loadData = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const cached = localStorage.getItem('gameopedia_sports_cache_v3');
      if (cached && showLoader) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.sports) setSports(parsed.sports);
          if (parsed.weekInfo) setWeekInfo(parsed.weekInfo);
          if (parsed.stats) setStats(parsed.stats);
          setLoading(false);
        } catch {}
      }

      const res = await fetch('/api/sports', { cache: 'no-store' });
      if (!res.ok) throw new Error(\`Failed to load sports: \${res.status}\`);
      const data = await res.json();
      setSports(data.sports || []);
      setWeekInfo(data.weekInfo || null);
      setStats(data.stats || null);
      localStorage.setItem('gameopedia_sports_cache_v3', JSON.stringify({
        sports: data.sports || [],
        weekInfo: data.weekInfo || null,
        stats: data.stats || null,
        cachedAt: Date.now()
      }));
    } catch (err) {
      console.error('Failed to load sports data:', err);
      if (!sports.length) showToastMsg('Failed to load sports data', 'error');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

`

    const googleAuth = `  const initGoogleAuth = () => {
    const start = () => {
      if (!window.google?.accounts?.id) return false;
      window.google.accounts.id.initialize({
        client_id: '${GOOGLE_CLIENT_ID}',
        auto_select: true,
        cancel_on_tap_outside: false,
        callback: async ({ credential }) => {
          try {
            const res = await fetch('/api/auth/google', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Google authentication failed');
            setCurrentUser(data.user); setUserToken(data.token);
            localStorage.setItem('gameopedia_user_profile', JSON.stringify(data.user));
            localStorage.setItem('gameopedia_user_token', data.token);
          } catch (err) {
            console.error('Google Workspace sign-in failed:', err);
            setCurrentUser(null); setUserToken('');
            showToastMsg(err.message || 'Google Workspace sign-in failed', 'error');
          }
        }
      });
      window.google.accounts.id.prompt();
      return true;
    };
    if (start()) return;
    const existing = document.querySelector('script[data-google-identity]');
    if (existing) { existing.addEventListener('load', start, { once: true }); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true;
    script.dataset.googleIdentity = 'true'; script.onload = start; document.head.appendChild(script);
  };

`

    let transformed = code
    transformed = transformed.replace(/const DEMO_PROFILES = \[[\s\S]*?\];\n\n/, 'const DEMO_PROFILES = [];\n\n')
    transformed = transformed.replace(/  const \[currentUser, setCurrentUser\] = useState\(\(\) => \{[\s\S]*?\n  \}\);/, "  const [currentUser, setCurrentUser] = useState(() => { try { const s = localStorage.getItem('gameopedia_user_profile'); return s ? JSON.parse(s) : null; } catch { return null; } });")
    transformed = transformed.replace(/  const \[userToken, setUserToken\] = useState\(\(\) => \{[\s\S]*?\n  \}\);/, "  const [userToken, setUserToken] = useState(() => localStorage.getItem('gameopedia_user_token') || '');")
    transformed = transformed.replace("onClick={() => setShowSwitchModal(true)}", "onClick={() => {}}")
    transformed = transformed.replace(/  useEffect\(\(\) => \{\n    loadData\(\);\n\n    if \(!currentUser\) \{[\s\S]*?\n    \}\n\n    const protocol =/, "  useEffect(() => {\n    loadData(true);\n    if (!currentUser) initGoogleAuth();\n\n    const protocol =")
    if (!code.includes('const loadData = async () =>')) transformed = transformed.replace(marker, loadData + googleAuth + marker)
    else transformed = transformed.replace(marker, googleAuth + marker)
    transformed = transformed.replace(/\n      \{showSwitchModal && \([\s\S]*?\n      \)\}\n\n      \{\/\* 🛡️ ADMIN PASSWORD MODAL \*\/\}/, "\n      {/* 🛡️ ADMIN PASSWORD MODAL */}")
    return { code: transformed, map: null }
  }
}

export default defineConfig({
  plugins: [repairLoadDataPlugin, react(), tailwindcss()],
  server: { port: 3000, proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true }, '/ws': { target: 'ws://localhost:5000', ws: true } } }
})
