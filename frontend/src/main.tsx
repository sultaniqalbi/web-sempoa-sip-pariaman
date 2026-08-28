import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/style-main.css'
import './styles/style-admin.css'
import './index.css'

// Auto reload when Vite chunk or CSS preload fails due to a new deployment
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Deployment update detected (preload error), reloading page to load latest version...', event);
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register Service Worker for Push Notifications & Auto Update
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
  });
}

