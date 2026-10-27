import type { ReactNode } from 'react'
import { IconeBusca } from './Icones'
import { iniciais } from '../formatos'

export function Chips<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
}: {
  opcoes: readonly { valor: T; rotulo: string }[]
  valor: NoInfer<T>
  onChange: (valor: T) => void
  rotulo: string
}) {
  return (
    <div className="chips" role="group" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          className="chip"
          aria-pressed={o.valor === valor}
          onClick={() => onChange(o.valor)}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}

export function Busca({
  valor,
  onChange,
  placeholder,
  rotulo,
}: {
  valor: string
  onChange(valor: string): void
  placeholder: string
  rotulo: string
}) {
  return (
    <label className="busca">
      <IconeBusca />
      <span className="sr-only">{rotulo}</span>
      <input type="search" value={valor} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function Esqueleto({ altura, quantidade = 1 }: { altura: number; quantidade?: number }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="esqueleto" style={{ height: altura }} />
      ))}
    </div>
  )
}

export function Estado({ titulo, children, acao }: { titulo: string; children?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="card estado" role="status">
      <strong>{titulo}</strong>
      {children && <p>{children}</p>}
      {acao}
    </div>
  )
}

export function ErroCarregar({ mensagem, onTentar }: { mensagem: string; onTentar(): void }) {
  return (
    <Estado
      titulo="Não foi possível carregar"
      acao={
        <button type="button" className="btn btn-contorno" onClick={onTentar}>
          Tentar de novo
        </button>
      }
    >
      {mensagem}
    </Estado>
  )
}

// Paleta dos avatares sem foto, escolhida de forma estável pelo nome.
const CORES_AVATAR = [
  ['#E4EDE2', '#195829'],
  ['#FDE68A', '#78350F'],
  ['#BBF7D0', '#14532D'],
  ['#FBCFE8', '#831843'],
  ['#E5E7EB', '#111827'],
]

export function Avatar({ nome, foto, tamanho = 46 }: { nome: string; foto?: string | null; tamanho?: number }) {
  const indice = [...nome].reduce((soma, c) => soma + c.charCodeAt(0), 0) % CORES_AVATAR.length
  const [fundo, cor] = CORES_AVATAR[indice]
  const estilo = {
    width: tamanho,
    height: tamanho,
    borderRadius: tamanho / 2,
    flexShrink: 0,
  }
  if (foto) return <img src={foto} alt="" style={{ ...estilo, objectFit: 'cover' }} />
  return (
    <span
      aria-hidden="true"
      style={{
        ...estilo,
        background: fundo,
        color: cor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(tamanho * 0.32),
        fontWeight: 800,
      }}
    >
      {iniciais(nome)}
    </span>
  )
}

export function AvisoFlutuante({ mensagem }: { mensagem: string | null }) {
  return (
    <div aria-live="polite">
      {mensagem && <div className="aviso-flutuante">{mensagem}</div>}
    </div>
  )
}
