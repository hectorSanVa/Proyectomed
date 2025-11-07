import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (error) {
  console.error('Error rendering app:', error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 2rem; font-family: Arial;">
        <h1>Error al cargar la aplicación</h1>
        <p>Por favor, abre la consola del navegador (F12) para ver el error detallado.</p>
        <pre>${error}</pre>
      </div>
    `;
  }
}
