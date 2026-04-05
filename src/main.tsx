import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

window.addEventListener('unhandledrejection', (event) => {
  // Prevent Vite overlay from masking the real API error details.
  console.error('Unhandled promise rejection:', event.reason)
  event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
