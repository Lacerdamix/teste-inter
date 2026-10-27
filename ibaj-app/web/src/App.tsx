import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { NavInferior } from './components/NavInferior'
import { Agenda } from './pages/Agenda'
import { Avisos } from './pages/Avisos'
import { Conteudos } from './pages/Conteudos'
import { Entrar } from './pages/Entrar'
import { Inicio } from './pages/Inicio'
import { Leitura } from './pages/Leitura'
import { Membros } from './pages/Membros'
import { Perfil } from './pages/Perfil'
import { Painel } from './pages/admin/Painel'

const TELAS_COM_NAV = ['/', '/avisos', '/agenda', '/conteudos', '/membros']

export function App() {
  const { pathname } = useLocation()
  const admin = pathname.startsWith('/admin')

  return (
    <div className="app" style={admin ? { maxWidth: 'none' } : undefined}>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/avisos" element={<Avisos />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/conteudos" element={<Conteudos />} />
        <Route path="/conteudos/:id" element={<Leitura />} />
        <Route path="/membros" element={<Membros />} />
        <Route path="/entrar" element={<Entrar />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/admin" element={<Painel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {TELAS_COM_NAV.includes(pathname) && <NavInferior />}
    </div>
  )
}
