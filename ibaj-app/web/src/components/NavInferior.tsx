import { NavLink } from 'react-router-dom'
import { IconeAgenda, IconeAvisos, IconeConteudos, IconeInicio, IconeMembros } from './Icones'

const abas = [
  { para: '/', rotulo: 'Início', Icone: IconeInicio },
  { para: '/avisos', rotulo: 'Avisos', Icone: IconeAvisos },
  { para: '/agenda', rotulo: 'Agenda', Icone: IconeAgenda },
  { para: '/conteudos', rotulo: 'Conteúdos', Icone: IconeConteudos },
  { para: '/membros', rotulo: 'Membros', Icone: IconeMembros },
]

export function NavInferior() {
  return (
    <nav className="nav" aria-label="Navegação principal">
      {abas.map(({ para, rotulo, Icone }) => (
        <NavLink key={para} to={para} end={para === '/'}>
          <Icone />
          {rotulo}
        </NavLink>
      ))}
    </nav>
  )
}
