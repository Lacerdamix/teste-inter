import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Chips, ErroCarregar, Esqueleto, Estado } from '../components/Comuns'
import { relativo } from '../formatos'
import { salvarPreferencia, useApi } from '../hooks'
import type { Aviso, Categoria } from '../tipos'

type Filtro = 'todos' | Categoria

const filtros: { valor: Filtro; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'igreja', rotulo: 'Igreja' },
  { valor: 'ministerios', rotulo: 'Ministérios' },
  { valor: 'eventos', rotulo: 'Eventos' },
]

export function Avisos() {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const { dados, erro, carregando, recarregar } = useApi<Aviso[]>(
    filtro === 'todos' ? '/avisos' : `/avisos?categoria=${filtro}`,
  )
  const { hash } = useLocation()

  useEffect(() => {
    salvarPreferencia('avisosVistosEm', new Date().toISOString())
  }, [dados])

  // Vindo de um aviso da tela inicial, rola até ele.
  useEffect(() => {
    if (dados && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'center' })
  }, [dados, hash])

  return (
    <main className="tela compacta">
      <h1 className="titulo-tela">Avisos</h1>
      <Chips rotulo="Filtrar avisos" opcoes={filtros} valor={filtro} onChange={setFiltro} />

      {carregando && !dados && <Esqueleto altura={140} quantidade={3} />}
      {erro && <ErroCarregar mensagem={erro.message} onTentar={recarregar} />}
      {dados?.length === 0 && <Estado titulo="Nenhum aviso por aqui">Quando a secretaria publicar, ele aparece nesta tela.</Estado>}

      {dados?.map((a) =>
        a.fixado ? <AvisoFixado key={a.id} aviso={a} /> : <AvisoSimples key={a.id} aviso={a} />,
      )}
    </main>
  )
}

function meta(aviso: Aviso) {
  const quando = relativo(aviso.publicado_em)
  if (aviso.fixado) return `Fixado, ${quando}`
  return aviso.origem ? `${aviso.origem}, ${quando}` : quando.charAt(0).toUpperCase() + quando.slice(1)
}

function AvisoFixado({ aviso }: { aviso: Aviso }) {
  return (
    <article id={aviso.id} className="card" style={{ borderRadius: 22, overflow: 'hidden' }}>
      {aviso.imagem_url && (
        <img src={aviso.imagem_url} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block', background: 'var(--salvia-suave)' }} />
      )}
      <div className="card-pad" style={{ gap: 8 }}>
        <span className="apoio">{meta(aviso)}</span>
        <h2 style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.25 }}>{aviso.titulo}</h2>
        <p className="corpo-texto" style={{ whiteSpace: 'pre-line' }}>{aviso.texto}</p>
        {aviso.cta_texto && aviso.cta_link && (
          <a href={aviso.cta_link} target="_blank" rel="noreferrer" className="btn btn-primario" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
            {aviso.cta_texto}
          </a>
        )}
      </div>
    </article>
  )
}

function AvisoSimples({ aviso }: { aviso: Aviso }) {
  return (
    <article id={aviso.id} className="card card-pad">
      {aviso.imagem_url && (
        <img src={aviso.imagem_url} alt="" style={{ width: '100%', borderRadius: 14, marginBottom: 6, display: 'block' }} />
      )}
      <span className="apoio">{meta(aviso)}</span>
      <h2>{aviso.titulo}</h2>
      <p className="corpo-texto" style={{ whiteSpace: 'pre-line' }}>{aviso.texto}</p>
      {aviso.cta_texto && aviso.cta_link && (
        <a href={aviso.cta_link} target="_blank" rel="noreferrer" className="link-verde" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
          {aviso.cta_texto}
        </a>
      )}
    </article>
  )
}
