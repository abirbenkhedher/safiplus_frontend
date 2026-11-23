import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './styles/theme.css';
import './styles/design-system.css';

// ✅ Nouvelle version mise en ligne pendant qu'un onglet était ouvert : les anciens fichiers
//    de pages n'existent plus → on recharge une fois pour récupérer la nouvelle version.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const deja = Number(sessionStorage.getItem('rechargementVersion') || 0);
    if (Date.now() - deja < 10000) return; // évite une boucle si le serveur est vraiment en panne
    sessionStorage.setItem('rechargementVersion', String(Date.now()));
  } catch { /* stockage indisponible : on recharge quand même */ }
  event.preventDefault();
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)