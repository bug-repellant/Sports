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
    return { code: code.replace(marker, injected + marker), map: null }
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
