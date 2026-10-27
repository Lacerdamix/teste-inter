import { Link } from 'react-router-dom'
import { ErroCarregar, Esqueleto } from '../components/Comuns'
import { IconeLivro, IconeSeta, IconeSino } from '../components/Icones'
import { InstalarApp } from '../components/InstalarApp'
import { links } from '../config'
import { dataLocal, dataPorExtenso, diaCurtoENumero, hora, primeiroNome, saudacao } from '../formatos'
import { lerPreferencia, useApi } from '../hooks'
import { useSessao } from '../sessao'
import type { Inicio as DadosInicio } from '../tipos'

export function Inicio() {
  const { usuario } = useSessao()
  const { dados, erro, carregando, recarregar } = useApi<DadosInicio>('/inicio')

  const vistoEm = lerPreferencia<string | null>('avisosVistosEm', null)
  const temAvisoNovo = !!dados?.ultimoAvisoEm && (!vistoEm || dados.ultimoAvisoEm > vistoEm)

  return (
    <main className="tela">
      <header className="cabecalho-tela">
        <Link to="/perfil" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo-ibaj.png" alt="IBaj, Igreja Batista do Jaraguá" style={{ height: 56, width: 'auto' }} />
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="apoio">{saudacao()}</span>
            <span style={{ fontSize: 18, fontWeight: 700 }}>
              {usuario ? primeiroNome(usuario.nome) : 'Boas-vindas'}
            </span>
          </span>
        </Link>
        <Link to="/avisos" className="botao-redondo" aria-label={temAvisoNovo ? 'Avisos, há novidades' : 'Avisos'}>
          <IconeSino />
          {temAvisoNovo && <span className="ponto-alerta" />}
        </Link>
      </header>

      <InstalarApp />

      {carregando && !dados && <Esqueleto altura={180} quantidade={3} />}
      {erro && <ErroCarregar mensagem={erro.message} onTentar={recarregar} />}

      {dados && (
        <>
          {dados.proximoCulto && (
            <section
              aria-label="Próximo culto"
              style={{
                background: 'var(--verde)',
                color: '#fff',
                borderRadius: 24,
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>Próximo culto</span>
              <Link to="/agenda" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>{dados.proximoCulto.titulo}</span>
                <span style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.4 }}>
                  {dataPorExtenso(dados.proximoCulto.inicio)}, às {hora(dados.proximoCulto.inicio)}
                  {dados.proximoCulto.descricao && `. ${dados.proximoCulto.descricao}`}
                </span>
              </Link>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a className="btn btn-claro" href={links.comoChegar} target="_blank" rel="noreferrer">
                  Como chegar
                </a>
                <a className="btn btn-vazado" href={links.assistirOnline} target="_blank" rel="noreferrer">
                  Assistir online
                </a>
              </div>
            </section>
          )}

          {dados.devocional && (
            <Link to={`/conteudos/${dados.devocional.id}`} className="card" style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
              <span className="icone-quadro">
                <IconeLivro />
              </span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span className="apoio">
                  {dados.devocional.data === dataLocal() ? 'Devocional de hoje' : 'Último devocional'}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{dados.devocional.titulo}</span>
                <span className="apoio">
                  {[dados.devocional.referencia, dados.devocional.duracao_min && `leitura de ${dados.devocional.duracao_min} min`]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </span>
              <IconeSeta stroke="#6B7280" />
            </Link>
          )}

          {dados.avisos.length > 0 && (
            <section className="secao">
              <div className="secao-cabecalho">
                <h2>Avisos</h2>
                <Link to="/avisos" className="link-verde">Ver todos</Link>
              </div>
              <div className="card lista">
                {dados.avisos.map((a) => (
                  <Link key={a.id} to={`/avisos#${a.id}`} className="lista-item">
                    <strong>{a.titulo}</strong>
                    <span className="apoio" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {a.texto}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {dados.semana.length > 0 && (
            <section className="secao">
              <div className="secao-cabecalho">
                <h2>Esta semana</h2>
                <Link to="/agenda" className="link-verde">Agenda</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${dados.semana.length}, minmax(0, 1fr))`, gap: 10 }}>
                {dados.semana.map((o) => (
                  <Link
                    key={o.id + o.inicio}
                    to="/agenda"
                    className="card"
                    style={{ borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}
                  >
                    <span className="apoio">{diaCurtoENumero(dataLocal(o.inicio))}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{o.titulo}</span>
                    <span className="apoio">{hora(o.inicio)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}
