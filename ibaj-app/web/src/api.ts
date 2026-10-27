const CHAVE_TOKEN = 'ibaj.token'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export function lerToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN)
  } catch {
    return null
  }
}

export function salvarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CHAVE_TOKEN, token)
    else localStorage.removeItem(CHAVE_TOKEN)
  } catch {
    // Armazenamento indisponível (modo privado): a sessão dura só esta aba.
  }
}

export async function api<T>(caminho: string, opcoes: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = lerToken()
  let resposta: Response
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: opcoes.method ?? 'GET',
      headers: {
        ...(opcoes.body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Sem conexão. Verifique sua internet e tente de novo.')
  }
  if (resposta.status === 204) return undefined as T
  const dados = await resposta.json().catch(() => null)
  if (!resposta.ok) throw new ApiError(resposta.status, dados?.erro ?? 'Algo deu errado. Tente de novo.')
  return dados as T
}
