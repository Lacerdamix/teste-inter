import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Busca, Chips, ErroCarregar, Esqueleto, Estado } from '../components/Comuns'
import { IconePlay } from '../components/Icones'
import { dataLocal, diaMesCurto, mesCurto } from '../formatos'
import { useApi, useAtrasado } from '../hooks'
import type { ConteudoResumo, TipoConteudo } from '../tipos'

type Filtro = 'tudo' | TipoConteudo

const filtros: { valor: Filtro; rotulo: string }[] = [
  { valor: 'tudo', rotulo: 'Tudo' },
  { valor: 'pregacao', rotulo: 'Pregações' },
  { valor: 'devocional', rotulo: 'Devocionais' },
  { valor: 'artigo', rotulo: 'Artigos' },
]

export function Conteudos() {
  const [filtro, setFiltro] = useState<Filtro>('tudo')
  const [busca, setBusca] = useState('')
  const termo = useAtrasado(busca.trim())

  const params = new URLSearchParams()
  if (filtro !== 'tudo') params.set('tipo', filtro)
  if (termo) params.set('q', termo)
  const { dados, erro, carregando, recarregar } = useApi<ConteudoResumo[]>(`/conteudos?${params}`)

  const filtrando = filtro !== 'tudo' || termo !== ''

  return (
    <main className="tela compacta">
      <h1 className="titulo-tela">Conteúdos</h1>
      <Busca valor={busca} onChange={setBusca} rotulo="Buscar conteúdo" placeholder="Buscar pregações, devocionais..." />
      <Chips rotulo="Filtrar conteúdos" opcoes={filtros} valor={filtro} onChange={setFiltro} />

      {carregando && !dados && <Esqueleto altura={92} quantidade={4} />}
      {erro && <ErroCarregar mensagem={erro.message} onTentar={recarregar} />}
      {dados?.length === 0 && (
        <Estado titulo="Nada encontrado">{termo ? `Nenhum conteúdo para "${termo}".` : 'Ainda não há conteúdos publicados.'}</Estado>
      )}

      {dados && dados.length > 0 && (filtrando ? <ListaSimples itens={dados} /> : <Destaques itens={dados} />)}
    </main>
  )
}

function Destaques({ itens }: { itens: ConteudoResumo[] }) {
  const pregacoes = itens.filter((c) => c.tipo === 'pregacao')
  const devocionais = itens.filter((c) => c.tipo === 'devocional').slice(0, 5)
  const artigos = itens.filter((c) => c.tipo === 'artigo').slice(0, 5)
  const [ultima, ...anteriores] = pregacoes

  return (
    <>
      {ultima && <CartaoVideo pregacao={ultima} />}
      {devocionais.length > 0 && (
        <section className="secao">
          <h2 style={{ fontSize: 19, fontWeight: 800 }}>Devocionais</h2>
          {devocionais.map((c) => <LinhaConteudo key={c.id} conteudo={c} />)}
        </section>
      )}
      {anteriores.length > 0 && (
        <section className="secao">
          <h2 style={{ fontSize: 19, fontWeight: 800 }}>Pregações anteriores</h2>
          {anteriores.slice(0, 5).map((c) => <LinhaConteudo key={c.id} conteudo={c} />)}
        </section>
      )}
      {artigos.length > 0 && (
        <section className="secao">
          <h2 style={{ fontSize: 19, fontWeight: 800 }}>Artigos</h2>
          {artigos.map((c) => <LinhaConteudo key={c.id} conteudo={c} />)}
        </section>
      )}
    </>
  )
}

function ListaSimples({ itens }: { itens: ConteudoResumo[] }) {
  return (
    <section className="secao">
      {itens.map((c) => <LinhaConteudo key={c.id} conteudo={c} />)}
    </section>
  )
}

function CartaoVideo({ pregacao }: { pregacao: ConteudoResumo }) {
  const conteudo = (
    <>
      <div style={{ height: 180, background: '#1F2937', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <span style={{ width: 60, height: 60, borderRadius: 30, background: '#fff', color: 'var(--texto)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconePlay />
        </span>
        {pregacao.duracao_min && (
          <span style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 12, fontWeight: 700, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 8 }}>
            {pregacao.duracao_min} min
          </span>
        )}
      </div>
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="apoio">Última pregação, {diaMesCurto(pregacao.data)}</span>
        <h2 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.25 }}>{pregacao.titulo}</h2>
        {pregacao.autor && <span style={{ fontSize: 14, color: 'var(--texto-corpo)' }}>{pregacao.autor}</span>}
      </div>
    </>
  )
  const estilo = { borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column' } as const
  return pregacao.video_url ? (
    <a href={pregacao.video_url} target="_blank" rel="noreferrer" className="card" style={estilo} aria-label={`Assistir ${pregacao.titulo}`}>
      {conteudo}
    </a>
  ) : (
    <Link to={`/conteudos/${pregacao.id}`} className="card" style={estilo}>
      {conteudo}
    </Link>
  )
}

function LinhaConteudo({ conteudo: c }: { conteudo: ConteudoResumo }) {
  const detalhes = [
    c.tipo === 'pregacao' ? diaMesCurto(c.data) : c.referencia,
    c.duracao_min && `${c.duracao_min} min`,
  ].filter(Boolean).join(', ')

  const miniatura =
    c.tipo === 'pregacao' ? (
      <span style={{ width: 96, height: 64, borderRadius: 12, background: '#374151', color: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconePlay tamanho={20} />
      </span>
    ) : (
      <span className={`selo-data${c.data === dataLocal() ? ' hoje' : ''}`}>
        <b>{Number(c.data.slice(8))}</b>
        <span>{mesCurto(c.data)}</span>
      </span>
    )

  const corpo = (
    <>
      {miniatura}
      <span className="textos">
        <strong>{c.titulo}</strong>
        <span className="apoio">{detalhes}</span>
      </span>
    </>
  )

  // Pregação abre direto o vídeo; devocionais e artigos abrem a leitura.
  if (c.tipo === 'pregacao' && c.video_url) {
    return (
      <a href={c.video_url} target="_blank" rel="noreferrer" className="card linha-card">
        {corpo}
      </a>
    )
  }
  return (
    <Link to={`/conteudos/${c.id}`} className="card linha-card">
      {corpo}
    </Link>
  )
}
