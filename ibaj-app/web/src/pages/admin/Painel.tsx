import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { AvisoFlutuante, Chips, ErroCarregar, Esqueleto, Estado } from '../../components/Comuns'
import { IconeSeta, IconeVoltar } from '../../components/Icones'
import { deCampoDataHora, diaMesCurto, hora, paraCampoDataHora } from '../../formatos'
import { useApi, useAvisoFlutuante } from '../../hooks'
import { useSessao } from '../../sessao'
import { recursos, type Campo, type ChaveRecurso, type Registro } from './recursos'

/** Painel da secretaria: publica avisos, eventos e conteúdos e cuida de membros e contas. */
export function Painel() {
  const { usuario, carregando } = useSessao()
  const [chave, setChave] = useState<ChaveRecurso>('avisos')

  if (carregando) return null
  if (usuario?.papel !== 'admin') {
    return (
      <main className="tela">
        <Estado titulo="Acesso restrito" acao={<Link to="/perfil" className="btn btn-primario">Minha conta</Link>}>
          O painel é usado pela secretaria da igreja.
        </Estado>
      </main>
    )
  }

  return (
    <main className="tela compacta" style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/perfil" className="botao-redondo creme" aria-label="Voltar">
          <IconeVoltar />
        </Link>
        <h1 className="titulo-tela">Secretaria</h1>
      </div>
      <Chips
        rotulo="Seção do painel"
        opcoes={Object.entries(recursos).map(([valor, r]) => ({ valor: valor as ChaveRecurso, rotulo: r.rotulo }))}
        valor={chave}
        onChange={setChave}
      />
      <Recurso key={chave} chave={chave} />
    </main>
  )
}

function Recurso({ chave }: { chave: ChaveRecurso }) {
  const recurso = recursos[chave]
  const lista = useApi<Registro[]>(`/admin/${chave}`)
  const membros = useApi<Registro[]>(chave === 'usuarios' ? '/admin/membros' : null)
  const [editando, setEditando] = useState<Registro | 'novo' | null>(null)
  const { mensagem, mostrar } = useAvisoFlutuante()

  if (editando) {
    return (
      <Formulario
        chave={chave}
        registro={editando === 'novo' ? null : editando}
        membros={membros.dados ?? []}
        onFechar={(texto) => {
          setEditando(null)
          if (texto) {
            mostrar(texto)
            lista.recarregar()
          }
        }}
      />
    )
  }

  return (
    <>
      {recurso.podeCriar && (
        <button type="button" className="btn btn-primario" style={{ alignSelf: 'flex-start' }} onClick={() => setEditando('novo')}>
          Novo {recurso.singular}
        </button>
      )}
      {lista.carregando && !lista.dados && <Esqueleto altura={64} quantidade={4} />}
      {lista.erro && <ErroCarregar mensagem={lista.erro.message} onTentar={lista.recarregar} />}
      {lista.dados?.length === 0 && <Estado titulo="Nada cadastrado ainda" />}
      {lista.dados && lista.dados.length > 0 && (
        <div className="card lista">
          {lista.dados.map((r) => {
            const { titulo, detalhe } = recurso.resumo(r, { diaMesCurto, hora })
            return (
              <button
                key={String(r.id)}
                type="button"
                className="lista-item"
                style={{ all: 'unset', cursor: 'pointer', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => setEditando(r)}
              >
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <strong style={{ fontSize: 15 }}>{titulo}</strong>
                  <span className="apoio">{detalhe}</span>
                </span>
                <IconeSeta stroke="#6B7280" />
              </button>
            )
          })}
        </div>
      )}
      <AvisoFlutuante mensagem={mensagem} />
    </>
  )
}

function valorInicial(campo: Campo, registro: Registro | null) {
  const valor = registro
    ? registro[campo.nome]
    : typeof campo.padrao === 'function' ? campo.padrao() : campo.padrao
  if (campo.tipo === 'check') return Boolean(valor ?? false)
  if (campo.tipo === 'dataHora') return paraCampoDataHora((valor as string) ?? null)
  if (campo.tipo === 'lista') return ((valor as string[]) ?? []).join(', ')
  return valor == null ? '' : String(valor)
}

function valorParaEnvio(campo: Campo, valor: string | boolean) {
  if (campo.tipo === 'check') return valor
  if (campo.tipo === 'dataHora') return deCampoDataHora(valor as string)
  if (campo.tipo === 'lista') return (valor as string).split(',').map((v) => v.trim()).filter(Boolean)
  return valor
}

function Formulario({
  chave,
  registro,
  membros,
  onFechar,
}: {
  chave: ChaveRecurso
  registro: Registro | null
  membros: Registro[]
  onFechar(mensagem?: string): void
}) {
  const recurso = recursos[chave]
  const { usuario } = useSessao()
  const [valores, setValores] = useState(() =>
    Object.fromEntries(recurso.campos.map((c) => [c.nome, valorInicial(c, registro)])),
  )
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    const body = Object.fromEntries(recurso.campos.map((c) => [c.nome, valorParaEnvio(c, valores[c.nome])]))
    try {
      if (registro) await api(`/admin/${chave}/${registro.id}`, { method: 'PUT', body })
      else await api(`/admin/${chave}`, { method: 'POST', body })
      onFechar(registro ? 'Alterações salvas' : 'Publicado')
    } catch (err) {
      setErro((err as Error).message)
      setEnviando(false)
    }
  }

  async function excluir() {
    if (!registro || !confirm(`Excluir ${recurso.singular}? Essa ação não pode ser desfeita.`)) return
    setEnviando(true)
    try {
      await api(`/admin/${chave}/${registro.id}`, { method: 'DELETE' })
      onFechar('Excluído')
    } catch (err) {
      setErro((err as Error).message)
      setEnviando(false)
    }
  }

  const proprioUsuario = chave === 'usuarios' && registro?.id === usuario?.id

  return (
    <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 19, fontWeight: 800 }}>
        {registro ? `Editar ${recurso.singular}` : `Novo ${recurso.singular}`}
      </h2>

      {recurso.campos.map((campo) => {
        const valor = valores[campo.nome]
        const mudar = (v: string | boolean) => setValores((atual) => ({ ...atual, [campo.nome]: v }))

        if (campo.tipo === 'check') {
          return (
            <label key={campo.nome} className="campo-check">
              <input type="checkbox" checked={valor as boolean} onChange={(e) => mudar(e.target.checked)} />
              {campo.rotulo}
            </label>
          )
        }

        const id = `campo-${campo.nome}`
        const comuns = {
          id,
          required: campo.obrigatorio,
          'aria-describedby': campo.ajuda ? `${id}-ajuda` : undefined,
        }
        let entrada
        if (campo.tipo === 'textarea') {
          entrada = <textarea {...comuns} value={valor as string} onChange={(e) => mudar(e.target.value)} />
        } else if (campo.tipo === 'opcoes' || campo.tipo === 'membro') {
          const opcoes =
            campo.tipo === 'membro'
              ? [{ valor: '', rotulo: 'Nenhum' }, ...membros.map((m) => ({ valor: String(m.id), rotulo: String(m.nome) }))]
              : campo.opcoes!
          entrada = (
            <select {...comuns} value={valor as string} onChange={(e) => mudar(e.target.value)}>
              {opcoes.map((o) => (
                <option key={o.valor} value={o.valor}>{o.rotulo}</option>
              ))}
            </select>
          )
        } else {
          const tipoInput = { texto: 'text', url: 'url', numero: 'number', data: 'date', dataHora: 'datetime-local', lista: 'text' }[campo.tipo]
          entrada = (
            <input
              {...comuns}
              type={tipoInput}
              value={valor as string}
              min={campo.min}
              max={campo.max}
              onChange={(e) => mudar(e.target.value)}
            />
          )
        }

        return (
          <div key={campo.nome} className="campo">
            <label htmlFor={id}>{campo.rotulo}</label>
            {entrada}
            {campo.ajuda && <span id={`${id}-ajuda`} className="apoio" style={{ fontWeight: 400 }}>{campo.ajuda}</span>}
          </div>
        )
      })}

      {erro && <p className="erro-form" role="alert">{erro}</p>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primario" disabled={enviando} style={{ flex: 1 }}>
          {registro ? 'Salvar' : 'Publicar'}
        </button>
        <button type="button" className="btn btn-contorno" disabled={enviando} onClick={() => onFechar()}>
          Cancelar
        </button>
      </div>
      {registro && !proprioUsuario && (
        <button type="button" className="btn btn-perigo" disabled={enviando} onClick={excluir}>
          Excluir {recurso.singular}
        </button>
      )}
    </form>
  )
}
