import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Chips } from '../components/Comuns'
import { IconeVoltar } from '../components/Icones'
import { useSessao } from '../sessao'

type Modo = 'entrar' | 'cadastro'

export function Entrar() {
  const { entrar, cadastrar } = useSessao()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const voltar = params.get('voltar')
  // Só aceita caminhos internos para não virar redirecionamento aberto.
  const destino = voltar?.startsWith('/') && !voltar.startsWith('//') ? voltar : '/'

  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      if (modo === 'entrar') await entrar(email, senha)
      else await cadastrar(nome, email, senha)
      navigate(destino, { replace: true })
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="tela" style={{ paddingBottom: 40 }}>
      <button type="button" className="botao-redondo creme" aria-label="Voltar" onClick={() => navigate(destino)}>
        <IconeVoltar />
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <img src="/logo-ibaj.png" alt="" style={{ height: 72, width: 'auto', alignSelf: 'flex-start' }} />
        <h1 className="titulo-tela">{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="corpo-texto">
          {modo === 'entrar'
            ? 'Use o e-mail cadastrado na IBaj para ver o hall de membros e salvar seus devocionais.'
            : 'Depois do cadastro, a secretaria confirma que você é membro para liberar o hall.'}
        </p>
      </div>

      <Chips
        rotulo="Tipo de acesso"
        opcoes={[
          { valor: 'entrar', rotulo: 'Já tenho conta' },
          { valor: 'cadastro', rotulo: 'Criar conta' },
        ]}
        valor={modo}
        onChange={(m) => {
          setModo(m)
          setErro(null)
        }}
      />

      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {modo === 'cadastro' && (
          <label className="campo">
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" required minLength={2} />
          </label>
        )}
        <label className="campo">
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="campo">
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            minLength={modo === 'cadastro' ? 8 : undefined}
            required
          />
        </label>
        {erro && <p className="erro-form" role="alert">{erro}</p>}
        <button type="submit" className="btn btn-primario btn-bloco" disabled={enviando}>
          {enviando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>
    </main>
  )
}
