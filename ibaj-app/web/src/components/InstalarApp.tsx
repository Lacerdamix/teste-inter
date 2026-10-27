import { useEffect, useState } from 'react'
import { lerPreferencia, salvarPreferencia } from '../hooks'

interface EventoInstalacao extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Convite discreto para instalar o PWA, quando o navegador permite. */
export function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null)
  const [dispensado, setDispensado] = useState(() => lerPreferencia('instalacaoDispensada', false))

  useEffect(() => {
    const capturar = (e: Event) => {
      e.preventDefault()
      setEvento(e as EventoInstalacao)
    }
    window.addEventListener('beforeinstallprompt', capturar)
    return () => window.removeEventListener('beforeinstallprompt', capturar)
  }, [])

  if (!evento || dispensado) return null

  return (
    <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <img src="/icons/icon-192.png" alt="" width={44} height={44} style={{ borderRadius: 12 }} />
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>
        Instale o app da IBaj na tela inicial
      </span>
      <button
        type="button"
        className="btn btn-contorno"
        onClick={() => {
          setDispensado(true)
          salvarPreferencia('instalacaoDispensada', true)
        }}
      >
        Agora não
      </button>
      <button
        type="button"
        className="btn btn-primario"
        onClick={async () => {
          await evento.prompt()
          setEvento(null)
        }}
      >
        Instalar
      </button>
    </div>
  )
}
