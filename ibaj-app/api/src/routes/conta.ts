import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { exigirLogin, HttpError, signToken, type Usuario } from '../auth.js'
import { query, queryOne } from '../db.js'

export const conta = Router()

const COLUNAS_USUARIO = 'id, nome, email, papel, aprovado, membro_id'

const credenciais = z.object({
  email: z.email('Informe um e-mail válido').trim().toLowerCase(),
  senha: z.string().min(1, 'Informe a senha'),
})

conta.post('/auth/entrar', async (req, res) => {
  const { email, senha } = credenciais.parse(req.body)
  const linha = await queryOne<Usuario & { senha_hash: string }>(
    `select ${COLUNAS_USUARIO}, senha_hash from usuarios where lower(email) = $1`,
    [email],
  )
  if (!linha || !(await bcrypt.compare(senha, linha.senha_hash))) {
    throw new HttpError(401, 'E-mail ou senha incorretos')
  }
  const { senha_hash: _, ...usuario } = linha
  res.json({ token: signToken(usuario.id), usuario })
})

const cadastro = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome'),
  email: z.email('Informe um e-mail válido').trim().toLowerCase(),
  senha: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres'),
})

conta.post('/auth/cadastro', async (req, res) => {
  const { nome, email, senha } = cadastro.parse(req.body)
  const usuario = await queryOne<Usuario>(
    `insert into usuarios (nome, email, senha_hash) values ($1, $2, $3)
     returning ${COLUNAS_USUARIO}`,
    [nome, email, await bcrypt.hash(senha, 10)],
  ).catch((err) => {
    if (err?.code === '23505') throw new HttpError(409, 'Este e-mail já está cadastrado')
    throw err
  })
  res.status(201).json({ token: signToken(usuario!.id), usuario })
})

conta.get('/eu', exigirLogin, async (req, res) => {
  const membro = req.usuario!.membro_id
    ? await queryOne('select id, nome, visivel_no_hall from membros where id = $1', [req.usuario!.membro_id])
    : null
  res.json({ ...req.usuario, membro })
})

const preferencias = z.object({ visivel_no_hall: z.boolean() })

// Cada membro decide se aparece no hall (LGPD).
conta.patch('/eu', exigirLogin, async (req, res) => {
  const { visivel_no_hall } = preferencias.parse(req.body)
  if (!req.usuario!.membro_id) throw new HttpError(409, 'Sua conta ainda não está vinculada a um membro')
  const membro = await queryOne(
    'update membros set visivel_no_hall = $2 where id = $1 returning id, nome, visivel_no_hall',
    [req.usuario!.membro_id, visivel_no_hall],
  )
  res.json({ ...req.usuario, membro })
})

const conteudoParam = z.object({ id: z.uuid() })

// Marcações pessoais: lido, favorito e lembrete são idempotentes (PUT liga, DELETE desliga).
const marcacoes = {
  lidos: { tabela: 'devocionais_lidos', coluna: 'conteudo_id', alvo: 'conteudos' },
  favoritos: { tabela: 'favoritos', coluna: 'conteudo_id', alvo: 'conteudos' },
  lembretes: { tabela: 'lembretes', coluna: 'evento_id', alvo: 'eventos' },
} as const

for (const [rota, { tabela, coluna, alvo }] of Object.entries(marcacoes)) {
  conta.put(`/eu/${rota}/:id`, exigirLogin, async (req, res) => {
    const { id } = conteudoParam.parse(req.params)
    const existe = await queryOne(`select 1 from ${alvo} where id = $1`, [id])
    if (!existe) throw new HttpError(404, 'Item não encontrado')
    await query(
      `insert into ${tabela} (usuario_id, ${coluna}) values ($1, $2) on conflict do nothing`,
      [req.usuario!.id, id],
    )
    res.status(204).end()
  })

  conta.delete(`/eu/${rota}/:id`, exigirLogin, async (req, res) => {
    const { id } = conteudoParam.parse(req.params)
    await query(`delete from ${tabela} where usuario_id = $1 and ${coluna} = $2`, [req.usuario!.id, id])
    res.status(204).end()
  })
}

conta.get('/eu/favoritos', exigirLogin, async (req, res) => {
  const favoritos = await query(
    `select c.id, c.tipo, c.titulo, c.autor, c.data, c.referencia, c.duracao_min
       from favoritos f join conteudos c on c.id = f.conteudo_id
      where f.usuario_id = $1 and c.publicado
      order by f.criado_em desc`,
    [req.usuario!.id],
  )
  res.json(favoritos)
})
