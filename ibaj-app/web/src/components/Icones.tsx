import type { ReactNode, SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & { tamanho?: number }

function Icone({ tamanho = 22, strokeWidth = 1.9, children, ...props }: Props & { children: ReactNode }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconeInicio = (p: Props) => (
  <Icone {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></Icone>
)
export const IconeAvisos = (p: Props) => (
  <Icone {...p}>
    <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6l-5 4H4a1 1 0 0 0-1 1z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </Icone>
)
export const IconeAgenda = (p: Props) => (
  <Icone {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Icone>
)
export const IconeConteudos = (p: Props) => (
  <Icone {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="m10 9 5 3-5 3z" /></Icone>
)
export const IconeMembros = (p: Props) => (
  <Icone {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
  </Icone>
)
export const IconeSino = (p: Props) => (
  <Icone strokeWidth={1.8} {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Icone>
)
export const IconeLivro = (p: Props) => (
  <Icone tamanho={24} strokeWidth={1.8} {...p}>
    <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
    <path d="M5 17a3 3 0 0 1 3-3h11" />
  </Icone>
)
export const IconeSeta = (p: Props) => (
  <Icone tamanho={20} strokeWidth={2} {...p}><path d="m9 6 6 6-6 6" /></Icone>
)
export const IconeVoltar = (p: Props) => (
  <Icone strokeWidth={2} {...p}><path d="m15 6-6 6 6 6" /></Icone>
)
export const IconeCompartilhar = (p: Props) => (
  <Icone tamanho={20} strokeWidth={2} {...p}>
    <path d="M12 3v12M7 8l5-5 5 5" />
    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </Icone>
)
export const IconeMarcador = ({ cheio, ...p }: Props & { cheio?: boolean }) => (
  <Icone {...p} fill={cheio ? 'currentColor' : 'none'}><path d="M6 3h12v18l-6-4-6 4z" /></Icone>
)
export const IconeBusca = (p: Props) => (
  <Icone tamanho={20} strokeWidth={2} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icone>
)
export const IconeMensagem = (p: Props) => (
  <Icone tamanho={20} {...p}><path d="M4 5h16v11H9l-5 4z" /></Icone>
)
export const IconeCheck = (p: Props) => (
  <Icone tamanho={20} strokeWidth={2.2} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icone>
)
export const IconePlay = ({ tamanho = 26 }: { tamanho?: number }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
)
