import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import { SessaoProvider } from './sessao'
import './styles.css'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SessaoProvider>
        <App />
      </SessaoProvider>
    </BrowserRouter>
  </StrictMode>,
)
