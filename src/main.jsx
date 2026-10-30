import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App.jsx'
import { TooltipProvider } from '@/components/ui/tooltip'
import './index.css'

createRoot(document.getElementById('root')).render(
  <>
    <TooltipProvider delayDuration={200}>
      <App />
    </TooltipProvider>
    <Toaster position="top-center" richColors closeButton theme="system" />
  </>
)
