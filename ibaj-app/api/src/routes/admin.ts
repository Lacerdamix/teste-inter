import { Router } from 'express'
import { z } from 'zod'
import { exigirAdmin, HttpError } from '../auth.js'
import { query, queryOne } from '../db.js'

export const admin = Router()
admin.use('/admin', exigirAdmin)

// Campos de texto vazios vindos do formulário viram null.
const texto = z.string().trim().transform((v) => (v === '' ? null : v))
const textoOpcional = opcional(texto)
const textoObrigatorio = z.string().trim().min(1, 'Campo obrigatório')
const instante = z.coerce.date({ error: 'Data inválida' })

// Campo opcional do formulário: vazio ou ausente vira null.
function opcional<T extends z.ZodType>(schema: T) {
  return z.preprocess((v) => (v === '' || v === undefined ? null : v), schema.nullable())
}

const recursos = {
  avisos: {
    ordem: 'fixado desc, publicado_em desc',
    schema: z
      .object({
        titulo: textoObrigatorio,
        texto: textoObrigatorio,
        categoria: z.enum(['igreja', 'ministerios', 'eventos']),
        origem: textoOpcional,
        imagem_url: textoOpcional,
        cta_texto: textoOpcional,
        cta_link: textoOpcional,
        fixado: z.boolean().default(false),
        publicado_em: instante.default(() => new Date()),
        expira_em: opcional(instante),
      })
      .refine((a) => (a.cta_texto === null) === (a.cta_link === null), {
        message: 'Preencha o texto e o link do botão, ou deixe os dois vazios',
      }),
  },
  eventos: {
    ordem: 'inicio desc',
    schema: z
      .object({
        titulo: textoObrigatorio,
        descricao: textoOpcional,
        local: textoOpcional,
        inicio: instante,
        fim: opcional(instante),
        recorrencia: z.enum(['nenhuma', 'semanal', 'quinzenal']).default('nenhuma'),
        destaque: z.boolean().default(false),
      })
      .refine((e) => e.fim === null || e.fim > e.inicio, { message: 'O fim precisa ser depois do início' }),
  },
  conteudos: {
    ordem: 'data desc, titulo',
    schema: z.object({
      tipo: z.enum(['pregacao', 'devocional', 'artigo']),
      titulo: textoObrigatorio,
      autor: textoOpcional,
      data: z.iso.date(),
      referencia: textoOpcional,
      versiculo_texto: textoOpcional,
      versiculo_ref: textoOpcional,
      corpo: textoOpcional,
      oracao: textoOpcional,
      video_url: textoOpcional,
      duracao_min: opcional(z.coerce.number().int().positive()),
      publicado: z.boolean().default(true),
    }),
  },
  membros: {
    ordem: 'nome',
    schema: z
      .object({
        nome: textoObrigatorio,
        foto_url: textoOpcional,
        aniversario_dia: opcional(z.coerce.number().int().min(1).max(31)),
        aniversario_mes: opcional(z.coerce.number().int().min(1).max(12)),
        ministerios: z.array(z.string().trim().min(1)).default([]),
        cargo: textoOpcional,
        lideranca: z.boolean().default(false),
        telefone: textoOpcional,
        email: textoOpcional,
        visivel_no_hall: z.boolean().default(true),
      })
      .refine((m) => (m.aniversario_dia === null) === (m.aniversario_mes === null), {
        message: 'Informe dia e mês do aniversário, ou deixe os dois vazios',
      }),
  },
  // Contas: a secretaria aprova, define o papel e vincula ao cadastro de membro.
  usuarios: {
    ordem: 'aprovado, criado_em desc',
    colunas: 'id, nome, email, papel, aprovado, membro_id, criado_em',
    somenteEdicao: true,
    schema: z.object({
      nome: textoObrigatorio,
      papel: z.enum(['membro', 'admin']),
      aprovado: z.boolean(),
      membro_id: opcional(z.uuid()),
    }),
  },
} satisfies Record<string, { ordem: string; schema: z.ZodType; colunas?: string; somenteEdicao?: boolean }>

const idParam = z.object({ id: z.uuid() })

for (const [nome, recurso] of Object.entries(recursos)) {
  const colunas = 'colunas' in recurso ? recurso.colunas : '*'
  const base = `/admin/${nome}`

  admin.get(base, async (_req, res) => {
    res.json(await query(`select ${colunas} from ${nome} order by ${recurso.ordem}`))
  })

  if (!('somenteEdicao' in recurso)) {
    admin.post(base, async (req, res) => {
      const dados = recurso.schema.parse(req.body) as Record<string, unknown>
      const campos = Object.keys(dados)
      const linha = await queryOne(
        `insert into ${nome} (${campos.join(', ')})
         values (${campos.map((_, i) => `$${i + 1}`).join(', ')})
         returning ${colunas}`,
        Object.values(dados),
      )
      res.status(201).json(linha)
    })
  }

  admin.put(`${base}/:id`, async (req, res) => {
    const { id } = idParam.parse(req.params)
    const dados = recurso.schema.parse(req.body) as Record<string, unknown>
    if (nome === 'usuarios' && id === req.usuario!.id && dados.papel !== 'admin') {
      throw new HttpError(409, 'Você não pode remover o próprio acesso de secretaria')
    }
    const campos = Object.keys(dados)
    const linha = await queryOne(
      `update ${nome} set ${campos.map((c, i) => `${c} = $${i + 2}`).join(', ')}
        where id = $1 returning ${colunas}`,
      [id, ...Object.values(dados)],
    )
    if (!linha) throw new HttpError(404, 'Registro não encontrado')
    res.json(linha)
  })

  admin.delete(`${base}/:id`, async (req, res) => {
    const { id } = idParam.parse(req.params)
    if (nome === 'usuarios' && id === req.usuario!.id) {
      throw new HttpError(409, 'Você não pode excluir a própria conta')
    }
    const linha = await queryOne(`delete from ${nome} where id = $1 returning id`, [id])
    if (!linha) throw new HttpError(404, 'Registro não encontrado')
    res.status(204).end()
  })
}
