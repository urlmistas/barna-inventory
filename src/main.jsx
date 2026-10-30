import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Toaster position="top-center" richColors closeButton theme="system" />
  </>
)
