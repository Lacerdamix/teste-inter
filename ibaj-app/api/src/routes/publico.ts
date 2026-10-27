import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../auth.js'
import { query, queryOne } from '../db.js'
import { listarOcorrencias } from '../lib/agenda.js'
import { dataLocal, inicioDoDia, somarDias } from '../lib/datas.js'
import { gerarIcs } from '../lib/ics.js'

export const publico = Router()

const AVISO_ATIVO = `publicado_em <= now() and (expira_em is null or expira_em > now())`

const RESUMO_CONTEUDO = `id, tipo, titulo, autor, data, referencia, video_url, duracao_min`

publico.get('/inicio', async (req, res) => {
  const agora = new Date()
  const fimDaSemana = inicioDoDia(somarDias(dataLocal(agora), 7))
  const usuarioId = req.usuario?.id

  const [proximoCulto, semana, devocional, avisos, ultimoAviso] = await Promise.all([
    listarOcorrencias({ de: agora, ate: inicioDoDia(somarDias(dataLocal(agora), 15)), somenteDestaque: true, limite: 1, usuarioId }),
    listarOcorrencias({ de: agora, ate: fimDaSemana, limite: 3, usuarioId }),
    queryOne(
      `select ${RESUMO_CONTEUDO} from conteudos
        where tipo = 'devocional' and publicado and data <= $1
        order by data desc limit 1`,
      [dataLocal(agora)],
    ),
    query(
      `select id, titulo, texto, categoria, origem, fixado, publicado_em from avisos
        where ${AVISO_ATIVO}
        order by fixado desc, publicado_em desc limit 2`,
    ),
    queryOne<{ publicado_em: Date }>(`select max(publicado_em) as publicado_em from avisos where ${AVISO_ATIVO}`),
  ])

  res.json({
    proximoCulto: proximoCulto[0] ?? null,
    semana,
    devocional,
    avisos,
    ultimoAvisoEm: ultimoAviso?.publicado_em ?? null,
  })
})

const filtroAvisos = z.object({
  categoria: z.enum(['igreja', 'ministerios', 'eventos']).optional(),
})

publico.get('/avisos', async (req, res) => {
  const { categoria } = filtroAvisos.parse(req.query)
  const avisos = await query(
    `select id, titulo, texto, categoria, origem, imagem_url, cta_texto, cta_link, fixado, publicado_em
       from avisos
      where ${AVISO_ATIVO} and ($1::text is null or categoria = $1)
      order by fixado desc, publicado_em desc`,
    [categoria ?? null],
  )
  res.json(avisos)
})

const filtroAgenda = z.object({
  de: z.iso.date().optional(),
  dias: z.coerce.number().int().min(1).max(62).default(7),
})

publico.get('/agenda', async (req, res) => {
  const { de, dias } = filtroAgenda.parse(req.query)
  const inicio = de ?? dataLocal()
  const ocorrencias = await listarOcorrencias({
    de: inicioDoDia(inicio),
    ate: inicioDoDia(somarDias(inicio, dias)),
    usuarioId: req.usuario?.id,
  })
  res.json(ocorrencias)
})

const idParam = z.object({ id: z.uuid() })

publico.get('/eventos/:id/calendario.ics', async (req, res) => {
  const { id } = idParam.parse(req.params)
  const evento = await queryOne<Parameters<typeof gerarIcs>[0]>(
    'select id, titulo, descricao, local, inicio, fim, recorrencia from eventos where id = $1',
    [id],
  )
  if (!evento) throw new HttpError(404, 'Evento não encontrado')
  res
    .type('text/calendar; charset=utf-8')
    .attachment('ibaj-evento.ics')
    .send(gerarIcs(evento))
})

const filtroConteudos = z.object({
  tipo: z.enum(['pregacao', 'devocional', 'artigo']).optional(),
  q: z.string().trim().max(100).optional(),
})

publico.get('/conteudos', async (req, res) => {
  const { tipo, q } = filtroConteudos.parse(req.query)
  const busca = q ? `%${q.replace(/[\\%_]/g, '\\$&')}%` : null
  const conteudos = await query(
    `select ${RESUMO_CONTEUDO} from conteudos
      where publicado and data <= $3
        and ($1::text is null or tipo = $1)
        and ($2::text is null or titulo ilike $2 or autor ilike $2 or referencia ilike $2 or corpo ilike $2)
      order by data desc, titulo
      limit 100`,
    [tipo ?? null, busca, dataLocal()],
  )
  res.json(conteudos)
})

publico.get('/conteudos/:id', async (req, res) => {
  const { id } = idParam.parse(req.params)
  const conteudo = await queryOne(
    `select c.*,
            exists (select 1 from devocionais_lidos l where l.conteudo_id = c.id and l.usuario_id = $2) as lido,
            exists (select 1 from favoritos f where f.conteudo_id = c.id and f.usuario_id = $2) as favorito
       from conteudos c
      where c.id = $1 and c.publicado and c.data <= $3`,
    [id, req.usuario?.id ?? null, dataLocal()],
  )
  if (!conteudo) throw new HttpError(404, 'Conteúdo não encontrado')
  res.json(conteudo)
})
