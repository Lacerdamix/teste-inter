import { Router } from 'express'
import { z } from 'zod'
import { exigirMembroAprovado } from '../auth.js'
import { query } from '../db.js'
import { aniversariantesDaSemana } from '../lib/aniversarios.js'

export const membros = Router()

const filtro = z.object({
  filtro: z.enum(['todos', 'lideranca', 'ministerios']).default('todos'),
  q: z.string().trim().max(100).optional(),
})

interface Membro {
  id: string
  nome: string
  foto_url: string | null
  aniversario_dia: number | null
  aniversario_mes: number | null
  ministerios: string[]
  cargo: string | null
  lideranca: boolean
  telefone: string | null
  email: string | null
}

// Busca sem diferenciar acentos nem maiúsculas ("lucia" encontra "Lúcia").
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR')
}

// Só membros aprovados veem o hall, e só quem optou por aparecer nele é listado.
membros.get('/membros', exigirMembroAprovado, async (req, res) => {
  const { filtro: tipo, q } = filtro.parse(req.query)
  const todos = await query<Membro>(
    `select id, nome, foto_url, aniversario_dia, aniversario_mes, ministerios, cargo, lideranca, telefone, email
       from membros
      where visivel_no_hall
      order by nome`,
  )

  const termo = q ? normalizar(q) : null
  const lista = todos.filter((m) => {
    if (tipo === 'lideranca' && !m.lideranca) return false
    if (tipo === 'ministerios' && m.ministerios.length === 0) return false
    if (!termo) return true
    return [m.nome, m.cargo ?? '', ...m.ministerios].some((t) => normalizar(t).includes(termo))
  })

  res.json({
    total: todos.length,
    aniversariantes: aniversariantesDaSemana(todos),
    membros: lista,
  })
})
