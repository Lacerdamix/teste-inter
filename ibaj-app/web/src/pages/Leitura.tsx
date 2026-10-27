import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { AvisoFlutuante, ErroCarregar, Esqueleto } from '../components/Comuns'
import { IconeCheck, IconeCompartilhar, IconeMarcador, IconeVoltar } from '../components/Icones'
import { dataPorExtenso } from '../formatos'
import { lerPreferencia, salvarPreferencia, useApi, useAvisoFlutuante, useExigirLogin } from '../hooks'
import type { Conteudo } from '../tipos'

const TAMANHOS = [16, 18, 20, 22]

/** Leitura de devocional ou artigo. */
export function Leitura() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { dados: c, erro, carregando, recarregar, definir } = useApi<Conteudo>(`/conteudos/${id}`)
  const [tamanho, setTamanho] = useState(() => lerPreferencia('tamanhoLeitura', 18))
  const { mensagem, mostrar } = useAvisoFlutuante()
  const exigirLogin = useExigirLogin()

  function voltar() {
    // Aberto por link direto não tem histórico dentro do app.
    if (location.key !== 'default') navigate(-1)
    else navigate('/conteudos')
  }

  function mudarTamanho() {
    const proximo = TAMANHOS[(TAMANHOS.indexOf(tamanho) + 1) % TAMANHOS.length]
    setTamanho(proximo)
    salvarPreferencia('tamanhoLeitura', proximo)
  }

  async function compartilhar() {
    if (!c) return
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: c.titulo, text: `${c.titulo}, IBaj`, url })
      } else {
        await navigator.clipboard.writeText(url)
        mostrar('Link copiado')
      }
    } catch {
      // Compartilhamento cancelado pela pessoa.
    }
  }

  async function alternar(campo: 'lido' | 'favorito') {
    if (!c || !exigirLogin()) return
    const rota = campo === 'lido' ? 'lidos' : 'favoritos'
    const ligado = !c[campo]
    definir({ ...c, [campo]: ligado })
    try {
      await api(`/eu/${rota}/${c.id}`, { method: ligado ? 'PUT' : 'DELETE' })
      if (campo === 'favorito') mostrar(ligado ? 'Salvo nos favoritos' : 'Removido dos favoritos')
    } catch (err) {
      definir(c)
      mostrar((err as Error).message)
    }
  }

  return (
    <div style={{ background: 'var(--superficie)', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: 'var(--superficie)',
          padding: 'calc(env(safe-area-inset-top) + 16px) 16px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 5,
        }}
      >
        <button type="button" className="botao-redondo creme" aria-label="Voltar" onClick={voltar}>
          <IconeVoltar />
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="botao-redondo creme"
            aria-label={`Tamanho do texto: ${tamanho} pixels. Toque para mudar`}
            onClick={mudarTamanho}
            style={{ fontSize: 15, fontWeight: 800 }}
          >
            Aa
          </button>
          <button type="button" className="botao-redondo creme" aria-label="Compartilhar" onClick={compartilhar}>
            <IconeCompartilhar />
          </button>
        </div>
      </div>

      <main style={{ flex: 1, padding: '16px 24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {carregando && !c && <Esqueleto altura={120} quantidade={3} />}
        {erro && <ErroCarregar mensagem={erro.message} onTentar={recarregar} />}

        {c && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, color: 'var(--texto-2)' }}>
                {dataPorExtenso(c.data)}
                {c.autor && `, ${c.autor}`}
              </span>
              <h1 className="titulo-tela">{c.titulo}</h1>
            </div>

            {c.versiculo_texto && (
              <blockquote style={{ margin: 0, background: 'var(--salvia-suave)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: tamanho + 3, lineHeight: 1.4 }}>
                  {c.versiculo_texto}
                </p>
                {c.versiculo_ref && (
                  <cite style={{ fontStyle: 'normal', fontSize: 14, fontWeight: 700, color: 'var(--verde)' }}>{c.versiculo_ref}</cite>
                )}
              </blockquote>
            )}

            {c.video_url && (
              <a href={c.video_url} target="_blank" rel="noreferrer" className="btn btn-contorno" style={{ alignSelf: 'flex-start' }}>
                Assistir no YouTube
              </a>
            )}

            {c.corpo && (
              <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: tamanho, lineHeight: 1.65, color: '#1F2937', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {c.corpo.split(/\n\s*\n/).map((paragrafo, i) => (
                  <p key={i} style={{ whiteSpace: 'pre-line' }}>{paragrafo}</p>
                ))}
              </div>
            )}

            {c.oracao && (
              <section style={{ borderTop: '1px solid var(--borda)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800 }}>Para orar</h2>
                <p style={{ fontSize: tamanho - 3, lineHeight: 1.55, color: 'var(--texto-corpo)' }}>{c.oracao}</p>
              </section>
            )}
          </>
        )}
      </main>

      {c && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: 'var(--superficie)',
            padding: '12px 20px calc(env(safe-area-inset-bottom) + 16px)',
            borderTop: '1px solid var(--borda)',
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            type="button"
            className={c.lido ? 'btn btn-contorno btn-bloco' : 'btn btn-primario btn-bloco'}
            style={{ flex: 1 }}
            aria-pressed={c.lido}
            onClick={() => alternar('lido')}
          >
            {c.lido ? (
              <>
                <IconeCheck /> Lido
              </>
            ) : (
              'Marcar como lido'
            )}
          </button>
          <button
            type="button"
            className="botao-redondo"
            style={{ width: 52, height: 52, borderRadius: 26, borderColor: 'var(--borda-forte)', color: c.favorito ? 'var(--verde)' : 'var(--texto)' }}
            aria-label={c.favorito ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            aria-pressed={c.favorito}
            onClick={() => alternar('favorito')}
          >
            <IconeMarcador cheio={c.favorito} />
          </button>
        </div>
      )}
      <AvisoFlutuante mensagem={mensagem} />
    </div>
  )
}
