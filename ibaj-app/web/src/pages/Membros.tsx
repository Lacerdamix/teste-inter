import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Busca, Chips, ErroCarregar, Esqueleto, Estado } from '../components/Comuns'
import { IconeMensagem } from '../components/Icones'
import { dataLocal, diaCurtoENumero, primeiroNome } from '../formatos'
import { useApi, useAtrasado } from '../hooks'
import { useSessao } from '../sessao'
import type { Membro } from '../tipos'

type Filtro = 'todos' | 'lideranca' | 'ministerios'

const filtros: { valor: Filtro; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'lideranca', rotulo: 'Liderança' },
  { valor: 'ministerios', rotulo: 'Ministérios' },
]

interface RespostaMembros {
  total: number
  aniversariantes: (Membro & { aniversario_data: string })[]
  membros: Membro[]
}

export function Membros() {
  const { usuario, carregando: carregandoSessao } = useSessao()
  const podeVer = !!usuario?.aprovado
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [busca, setBusca] = useState('')
  const termo = useAtrasado(busca.trim())

  const params = new URLSearchParams({ filtro })
  if (termo) params.set('q', termo)
  const { dados, erro, carregando, recarregar } = useApi<RespostaMembros>(podeVer ? `/membros?${params}` : null)

  return (
    <main className="tela compacta">
      <div className="cabecalho-tela">
        <h1 className="titulo-tela">Membros</h1>
        {dados && (
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--texto-2)' }}>
            {dados.total} {dados.total === 1 ? 'pessoa' : 'pessoas'}
          </span>
        )}
      </div>

      {!carregandoSessao && !usuario && (
        <Estado
          titulo="Área dos membros"
          acao={<Link to="/entrar?voltar=/membros" className="btn btn-primario">Entrar</Link>}
        >
          Para proteger os dados da igreja, o hall de membros aparece só para quem tem cadastro aprovado.
        </Estado>
      )}
      {usuario && !usuario.aprovado && (
        <Estado titulo="Cadastro em análise">
          A secretaria vai confirmar seu cadastro. Assim que for aprovado, o hall de membros aparece aqui.
        </Estado>
      )}

      {podeVer && (
        <>
          <Busca valor={busca} onChange={setBusca} rotulo="Buscar membro" placeholder="Buscar por nome ou ministério" />

          {dados && dados.aniversariantes.length > 0 && (
            <section className="card" style={{ borderRadius: 22, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800 }}>Aniversariantes da semana</h2>
              <ul style={{ display: 'flex', gap: 12, overflowX: 'auto', margin: '0 -5px', padding: '5px 5px 2px', listStyle: 'none', scrollbarWidth: 'none' }}>
                {dados.aniversariantes.map((m) => (
                  <li key={m.id} style={{ width: 66, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ borderRadius: '50%', boxShadow: '0 0 0 3px #fff, 0 0 0 5px var(--verde)' }}>
                      <Avatar nome={m.nome} foto={m.foto_url} tamanho={56} />
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'center' }}>{primeiroNome(m.nome)}</span>
                    <span style={{ fontSize: 12, color: 'var(--texto-2)' }}>
                      {m.aniversario_data === dataLocal() ? 'Hoje' : diaCurtoENumero(m.aniversario_data)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Chips rotulo="Filtrar membros" opcoes={filtros} valor={filtro} onChange={setFiltro} />

          {carregando && !dados && <Esqueleto altura={70} quantidade={5} />}
          {erro && <ErroCarregar mensagem={erro.message} onTentar={recarregar} />}
          {dados?.membros.length === 0 && <Estado titulo="Ninguém encontrado">Tente outro nome ou ministério.</Estado>}

          {dados && dados.membros.length > 0 && (
            <ul className="card lista" style={{ borderRadius: 22, margin: 0, padding: 0, listStyle: 'none' }}>
              {dados.membros.map((m) => <LinhaMembro key={m.id} membro={m} />)}
            </ul>
          )}
        </>
      )}
    </main>
  )
}

function contato(m: Membro) {
  if (m.telefone) {
    const numero = m.telefone.replace(/\D/g, '')
    return `https://wa.me/${numero.length <= 11 ? `55${numero}` : numero}`
  }
  if (m.email) return `mailto:${m.email}`
  return null
}

function LinhaMembro({ membro: m }: { membro: Membro }) {
  const link = contato(m)
  const descricao = [m.cargo, ...m.ministerios].filter(Boolean).join(', ')
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderColor: 'var(--fundo)' }}>
      <Avatar nome={m.nome} foto={m.foto_url} />
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{m.nome}</span>
        {descricao && <span className="apoio">{descricao}</span>}
      </span>
      {link && (
        <a href={link} target="_blank" rel="noreferrer" className="botao-redondo" aria-label={`Enviar mensagem para ${m.nome}`}>
          <IconeMensagem />
        </a>
      )}
    </li>
  )
}
