import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Estado } from '../components/Comuns'
import { IconeSeta, IconeVoltar } from '../components/Icones'
import { diaMesCurto } from '../formatos'
import { useApi } from '../hooks'
import { useSessao } from '../sessao'
import type { ConteudoResumo, Usuario } from '../tipos'

export function Perfil() {
  const { usuario, carregando, sair, atualizar } = useSessao()
  const navigate = useNavigate()
  const favoritos = useApi<ConteudoResumo[]>(usuario ? '/eu/favoritos' : null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function alternarHall(visivel: boolean) {
    setSalvando(true)
    setErro(null)
    try {
      atualizar(await api<Usuario>('/eu', { method: 'PATCH', body: { visivel_no_hall: visivel } }))
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="tela">
      <button type="button" className="botao-redondo creme" aria-label="Voltar" onClick={() => navigate('/')}>
        <IconeVoltar />
      </button>
      <h1 className="titulo-tela">Minha conta</h1>

      {!carregando && !usuario && (
        <Estado titulo="Você não entrou" acao={<Link to="/entrar?voltar=/perfil" className="btn btn-primario">Entrar ou criar conta</Link>}>
          Com uma conta você salva devocionais, marca leituras e acessa o hall de membros.
        </Estado>
      )}

      {usuario && (
        <>
          <section className="card card-pad">
            <h2 style={{ fontSize: 19, fontWeight: 800 }}>{usuario.nome}</h2>
            <span className="apoio">{usuario.email}</span>
            {!usuario.aprovado && (
              <p className="corpo-texto" style={{ marginTop: 6 }}>
                Seu cadastro está aguardando a confirmação da secretaria.
              </p>
            )}
          </section>

          {usuario.membro && (
            <section className="card card-pad" style={{ gap: 10 }}>
              <h2>Privacidade</h2>
              <label className="campo-check">
                <input
                  type="checkbox"
                  checked={usuario.membro.visivel_no_hall}
                  disabled={salvando}
                  onChange={(e) => alternarHall(e.target.checked)}
                />
                Aparecer no hall de membros
              </label>
              <p className="apoio" style={{ lineHeight: 1.5 }}>
                Só membros aprovados veem o hall. Do seu aniversário, mostramos apenas dia e mês.
              </p>
              {erro && <p className="erro-form" role="alert">{erro}</p>}
            </section>
          )}

          <section className="secao">
            <h2 style={{ fontSize: 19, fontWeight: 800 }}>Favoritos</h2>
            {favoritos.dados?.length === 0 && (
              <p className="apoio" style={{ fontSize: 14 }}>Toque no marcador de um devocional para guardar aqui.</p>
            )}
            {favoritos.dados && favoritos.dados.length > 0 && (
              <div className="card lista">
                {favoritos.dados.map((c) => (
                  <Link key={c.id} to={`/conteudos/${c.id}`} className="lista-item" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <strong>{c.titulo}</strong>
                      <span className="apoio">{[c.referencia, diaMesCurto(c.data)].filter(Boolean).join(', ')}</span>
                    </span>
                    <IconeSeta stroke="#6B7280" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {usuario.papel === 'admin' && (
            <Link to="/admin" className="btn btn-contorno btn-bloco">Painel da secretaria</Link>
          )}
          <button
            type="button"
            className="btn btn-perigo btn-bloco"
            onClick={async () => {
              await sair()
              navigate('/')
            }}
          >
            Sair da conta
          </button>
        </>
      )}
    </main>
  )
}
