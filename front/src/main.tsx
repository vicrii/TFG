// Importar el silenciador de warnings antes que nada
import './utils/silenceWarnings';

import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import 'bootstrap/dist/css/bootstrap.min.css'

// Global error handler para errores de wallet no capturados
window.addEventListener('error', (event) => {
  const error = event.error;
  if (error && (
    error.message?.includes('WalletConnectionError') ||
    error.message?.includes('WalletNotConnectedError') ||
    error.message?.includes('Unexpected error') ||
    error.name?.includes('Wallet')
  )) {
    console.warn('[Global] Wallet error silenciado:', error.message);
    event.preventDefault(); // Prevenir que el error se muestre en la consola
    return false;
  }
});

// También para promesas rechazadas no manejadas
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  if (error && (
    error.message?.includes('WalletConnectionError') ||
    error.message?.includes('WalletNotConnectedError') ||
    error.message?.includes('Unexpected error') ||
    error.name?.includes('Wallet')
  )) {
    console.warn('[Global] Wallet promise rejection silenciado:', error.message);
    event.preventDefault(); // Prevenir que el error se muestre en la consola
    return false;
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>,
)
