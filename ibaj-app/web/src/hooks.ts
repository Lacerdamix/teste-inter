import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, ApiError } from './api'
import { useSessao } from './sessao'

interface Estado<T> {
  dados: T | null
  erro: ApiError | null
  carregando: boolean
}

/** Busca um recurso da API e refaz a busca quando o caminho ou o usuário mudam. */
export function useApi<T>(caminho: string | null) {
  const { usuario } = useSessao()
  const [estado, setEstado] = useState<Estado<T>>({ dados: null, erro: null, carregando: caminho !== null })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (caminho === null) return
    let ativo = true
    setEstado((e) => ({ ...e, erro: null, carregando: true }))
    api<T>(caminho)
      .then((dados) => ativo && setEstado({ dados, erro: null, carregando: false }))
      .catch((erro: ApiError) => ativo && setEstado({ dados: null, erro, carregando: false }))
    return () => {
      ativo = false
    }
  }, [caminho, usuario?.id, versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])
  const definir = useCallback((dados: T) => setEstado({ dados, erro: null, carregando: false }), [])
  return { ...estado, recarregar, definir }
}

/** Valor que só atualiza depois de um intervalo sem mudanças (busca enquanto digita). */
export function useAtrasado<T>(valor: T, ms = 300) {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return atrasado
}

/** Leva para o login e volta para a tela atual depois. */
export function useExigirLogin() {
  const { usuario } = useSessao()
  const navigate = useNavigate()
  const location = useLocation()
  return useCallback(() => {
    if (usuario) return true
    navigate(`/entrar?voltar=${encodeURIComponent(location.pathname + location.search)}`)
    return false
  }, [usuario, navigate, location])
}

/** Mensagem curta que some sozinha. */
export function useAvisoFlutuante() {
  const [mensagem, setMensagem] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const mostrar = useCallback((texto: string) => {
    clearTimeout(timer.current)
    setMensagem(texto)
    timer.current = setTimeout(() => setMensagem(null), 2600)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return { mensagem, mostrar }
}

export function lerPreferencia<T>(chave: string, padrao: T): T {
  try {
    const valor = localStorage.getItem(`ibaj.${chave}`)
    return valor === null ? padrao : (JSON.parse(valor) as T)
  } catch {
    return padrao
  }
}

export function salvarPreferencia(chave: string, valor: unknown) {
  try {
    localStorage.setItem(`ibaj.${chave}`, JSON.stringify(valor))
  } catch {
    // Sem armazenamento local: a preferência vale só nesta visita.
  }
}
