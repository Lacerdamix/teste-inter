import { useMemo, useState } from 'react'
import { api } from '../api'
import { AvisoFlutuante, ErroCarregar, Esqueleto, Estado } from '../components/Comuns'
import { IconeSeta, IconeVoltar } from '../components/Icones'
import { dataLocal, diaSemanaCurto, diaSemanaENumero, hora, nomeDoMes, somarDias } from '../formatos'
import { useApi, useAvisoFlutuante, useExigirLogin } from '../hooks'
import type { Ocorrencia } from '../tipos'

export function Agenda() {
  const hoje = dataLocal()
  const [inicioSemana, setInicioSemana] = useState(hoje)
  const [selecionado, setSelecionado] = useState(hoje)
  const { dados, erro, carregando, recarregar, definir } = useApi<Ocorrencia[]>(`/agenda?de=${inicioSemana}&dias=7`)
  const { mensagem, mostrar } = useAvisoFlutuante()

  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => somarDias(inicioSemana, i)), [inicioSemana])

  // A lista mostra a semana a partir do dia escolhido, agrupada por dia.
  const grupos = useMemo(() => {
    const porDia = new Map<string, Ocorrencia[]>()
    for (const o of dados ?? []) {
      const dia = dataLocal(o.inicio)
      if (dia < selecionado) continue
      porDia.set(dia, [...(porDia.get(dia) ?? []), o])
    }
    return porDia
  }, [dados, selecionado])

  function mudarSemana(delta: number) {
    const novo = somarDias(inicioSemana, delta * 7)
    setInicioSemana(novo)
    setSelecionado(novo)
  }

  function atualizarOcorrencia(id: string, lembrete: boolean) {
    if (dados) definir(dados.map((o) => (o.id === id ? { ...o, lembrete } : o)))
  }

  return (
    <main className="tela compacta">
      <div className="cabecalho-tela">
        <h1 className="titulo-tela">Agenda</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            className="botao-redondo creme"
            aria-label="Semana anterior"
            disabled={inicioSemana <= hoje}
            style={{ opacity: inicioSemana <= hoje ? 0.35 : 1 }}
            onClick={() => mudarSemana(-1)}
          >
            <IconeVoltar tamanho={20} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--texto-2)', minWidth: 72, textAlign: 'center' }}>
            {nomeDoMes(selecionado)}
          </span>
          <button type="button" className="botao-redondo creme" aria-label="Próxima semana" onClick={() => mudarSemana(1)}>
            <IconeSeta />
          </button>
        </div>
      </div>

      <div role="group" aria-label="Dias da semana" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
        {dias.map((dia) => {
          const ativo = dia === selecionado
          return (
            <button
              key={dia}
              type="button"
              aria-pressed={ativo}
              aria-label={dia === hoje ? `Hoje, ${diaSemanaENumero(dia)}` : diaSemanaENumero(dia)}
              onClick={() => setSelecionado(dia)}
              style={{
                border: ativo ? '1px solid var(--verde)' : '1px solid var(--borda)',
                background: ativo ? 'var(--verde)' : 'var(--superficie)',
                color: ativo ? '#fff' : 'var(--texto)',
                borderRadius: 16,
                padding: '10px 0',
                minHeight: 60,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: ativo ? '#fff' : 'var(--texto-2)' }}>
                {diaSemanaCurto(dia)}
              </span>
              <span style={{ fontSize: 17, fontWeight: 800 }}>{Number(dia.slice(8))}</span>
            </button>
          )
        })}
      </div>

      {carregando && !dados && <Esqueleto altura={80} quantidade={4} />}
      {erro && <ErroCarregar mensagem={erro.message} onTentar={recarregar} />}

      {dados && !grupos.has(selecionado) && (
        <p className="apoio" style={{ fontSize: 14 }}>
          Nada programado para {selecionado === hoje ? 'hoje' : diaSemanaENumero(selecionado).toLowerCase()}.
        </p>
      )}
      {dados && grupos.size === 0 && (
        <Estado titulo="Semana sem encontros">Confira a próxima semana ou fale com a secretaria.</Estado>
      )}

      {[...grupos].map(([dia, ocorrencias]) => (
        <section key={dia} className="secao" style={{ gap: 10 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>{dia === hoje ? 'Hoje' : diaSemanaENumero(dia)}</h2>
          {ocorrencias.map((o) => (
            <CartaoEvento key={o.id + o.inicio} ocorrencia={o} onLembrete={atualizarOcorrencia} avisar={mostrar} />
          ))}
        </section>
      ))}

      <AvisoFlutuante mensagem={mensagem} />
    </main>
  )
}

function CartaoEvento({
  ocorrencia: o,
  onLembrete,
  avisar,
}: {
  ocorrencia: Ocorrencia
  onLembrete(id: string, ativo: boolean): void
  avisar(texto: string): void
}) {
  const [aberto, setAberto] = useState(o.destaque)
  const [salvando, setSalvando] = useState(false)
  const exigirLogin = useExigirLogin()

  async function alternarLembrete() {
    if (!exigirLogin()) return
    setSalvando(true)
    try {
      await api(`/eu/lembretes/${o.id}`, { method: o.lembrete ? 'DELETE' : 'PUT' })
      onLembrete(o.id, !o.lembrete)
      avisar(o.lembrete ? 'Lembrete removido' : 'Lembrete salvo')
    } catch (err) {
      avisar((err as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  const subtitulo = o.descricao ?? o.local

  return (
    <div
      className="card"
      style={{
        border: o.destaque ? '2px solid var(--verde)' : undefined,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
        style={{ all: 'unset', cursor: 'pointer', display: 'flex', gap: 14, minHeight: 44 }}
      >
        <span style={{ width: 56, flexShrink: 0, fontSize: 16, fontWeight: 800 }}>{hora(o.inicio)}</span>
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{o.titulo}</span>
          {subtitulo && <span className="apoio">{subtitulo}</span>}
        </span>
      </button>
      {aberto && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={o.lembrete ? 'btn btn-contorno' : 'btn btn-primario'}
            style={{ flex: 1 }}
            disabled={salvando}
            aria-pressed={o.lembrete}
            onClick={alternarLembrete}
          >
            {o.lembrete ? 'Lembrete salvo' : 'Lembrar-me'}
          </button>
          <a className="btn btn-contorno" style={{ flex: 1 }} href={`/api/eventos/${o.id}/calendario.ics`} download>
            Adicionar ao calendário
          </a>
        </div>
      )}
    </div>
  )
}
