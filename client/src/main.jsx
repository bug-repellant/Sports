import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Ensure any stale Sheets-sync service worker is removed, then install the
// current worker. The worker is intentionally registered from the app entry
// point; previously it existed in public/ but was never registered here.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      await navigator.serviceWorker.register('/sheets-sync-sw.js?v=4', {
        scope: '/',
        updateViaCache: 'none'
      });
    } catch (error) {
      console.warn('Sheets sync service worker setup failed:', error);
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
