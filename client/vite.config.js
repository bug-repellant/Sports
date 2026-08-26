import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const repairLoadDataPlugin = {
  name: 'repair-missing-load-data',
  enforce: 'pre',
  transform(code, id) {
    if (!id.endsWith('/client/src/App.jsx')) return null
    if (code.includes('const loadData = async () =>')) return null

    const marker = '  const showToastMsg = (msg, type = \'success\') => {'
    const injected = `  const loadData = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await fetch('/api/sports');
      if (!res.ok) throw new Error(\`Failed to load sports: \${res.status}\`);
      const data = await res.json();
      setSports(data.sports || []);
      setWeekInfo(data.weekInfo || null);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to load sports data:', err);
      showToastMsg('Failed to load sports data', 'error');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

`

    if (!code.includes(marker)) return null
    let transformed = code.replace(marker, injected + marker)

    // The first load is the only load that should show the full-page loader.
    transformed = transformed.replace(
      '  useEffect(() => {\n    loadData();',
      '  useEffect(() => {\n    loadData(true);'
    )

    // Optimistic signup/cancel: update the card immediately instead of waiting
    // for the API response and a second full data fetch.
    const signupMarker = `    const isSignedUp = sport.signups?.some(\n      p => p.email.toLowerCase() === currentUser.email.toLowerCase()\n    );`
    const optimistic = `${signupMarker}\n\n    // Update the UI immediately; the server request remains authoritative.\n    setSports(prev => prev.map(s => {\n      if (s.id !== sport.id) return s;\n      const signups = Array.isArray(s.signups) ? s.signups : [];\n      if (isSignedUp) {\n        return { ...s, signups: signups.filter(p => p.email.toLowerCase() !== currentUser.email.toLowerCase()) };\n      }\n      return { ...s, signups: [...signups, { name: currentUser.name, email: currentUser.email }] };\n    }));`
    transformed = transformed.replace(signupMarker, optimistic)

    // The WebSocket broadcasts authoritative updates, so don't make a second
    // HTTP request after every successful click.
    transformed = transformed.replace(
      /\n      loadData\(\);\n    } catch \{\n      showToastMsg\('Network error while signing up', 'error'\);/,
      "\n    } catch {\n      // Re-sync only when the request fails, correcting the optimistic UI.\n      loadData(false);\n      showToastMsg('Network error while signing up', 'error');"
    )

    return { code: transformed, map: null }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    repairLoadDataPlugin,
    react(),
    tailwindcss()
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:5000',
        ws: true
      }
    }
  }
})
