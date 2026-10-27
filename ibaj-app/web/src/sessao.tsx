import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, lerToken, salvarToken } from './api'
import type { Usuario } from './tipos'

interface Sessao {
  usuario: Usuario | null
  carregando: boolean
  entrar(email: string, senha: string): Promise<void>
  cadastrar(nome: string, email: string, senha: string): Promise<void>
  sair(): Promise<void>
  atualizar(usuario: Usuario): void
}

const SessaoContext = createContext<Sessao | null>(null)

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(() => lerToken() !== null)

  useEffect(() => {
    if (!lerToken()) return
    api<Usuario>('/eu')
      .then(setUsuario)
      .catch((err) => {
        // Token expirado ou conta removida; sem rede, mantém o token para tentar depois.
        if (err instanceof ApiError && err.status === 401) salvarToken(null)
      })
      .finally(() => setCarregando(false))
  }, [])

  const iniciar = useCallback(async (caminho: string, body: unknown) => {
    const { token } = await api<{ token: string }>(caminho, { method: 'POST', body })
    salvarToken(token)
    setUsuario(await api<Usuario>('/eu'))
  }, [])

  const valor = useMemo<Sessao>(
    () => ({
      usuario,
      carregando,
      entrar: (email, senha) => iniciar('/auth/entrar', { email, senha }),
      cadastrar: (nome, email, senha) => iniciar('/auth/cadastro', { nome, email, senha }),
      async sair() {
        salvarToken(null)
        setUsuario(null)
        // Respostas guardadas offline podem ter dados pessoais (hall de membros).
        if ('caches' in window) await caches.delete('api').catch(() => {})
      },
      atualizar: setUsuario,
    }),
    [usuario, carregando, iniciar],
  )

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>
}

export function useSessao() {
  const sessao = useContext(SessaoContext)
  if (!sessao) throw new Error('useSessao fora do SessaoProvider')
  return sessao
}
