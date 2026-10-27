import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import express, { type ErrorRequestHandler } from 'express'
import { z, ZodError } from 'zod'
import { carregarUsuario, HttpError } from './auth.js'
import { admin } from './routes/admin.js'
import { conta } from './routes/conta.js'
import { membros } from './routes/membros.js'
import { publico } from './routes/publico.js'

// Mensagens de validação em português.
z.config(z.locales.pt())

const tratarErros: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ erro: err.message })
  } else if (err instanceof ZodError) {
    res.status(400).json({ erro: err.issues[0]?.message ?? 'Dados inválidos', detalhes: err.issues })
  } else if (err?.code === '23505') {
    res.status(409).json({ erro: 'Já existe um registro com esses dados' })
  } else if (err?.code === '23503') {
    res.status(409).json({ erro: 'Registro vinculado a outro que não existe ou está em uso' })
  } else if (err?.code === '23514') {
    res.status(400).json({ erro: 'Dados inválidos' })
  } else if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ erro: 'JSON inválido' })
  } else {
    console.error(err)
    res.status(500).json({ erro: 'Erro interno' })
  }
}

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))

  const api = express.Router()
  api.use(carregarUsuario)
  api.use(publico, conta, membros, admin)
  api.use((_req, _res) => {
    throw new HttpError(404, 'Rota não encontrada')
  })
  app.use('/api', api)

  // Em produção a própria API serve o PWA já compilado (web/dist).
  const webDist = ['../../web/dist', '../../../web/dist']
    .map((rel) => fileURLToPath(new URL(rel, import.meta.url)))
    .find((dir) => existsSync(dir))
  if (webDist) {
    app.use(
      express.static(webDist, {
        index: false,
        // Arquivos com hash no nome são imutáveis; o resto (service worker,
        // manifest, ícones) precisa ser revalidado para o app atualizar.
        setHeaders(res, path) {
          res.setHeader('Cache-Control', path.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache')
        },
      }),
    )
    app.get('/{*rota}', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache')
      res.sendFile('index.html', { root: webDist })
    })
  }

  app.use(tratarErros)
  return app
}
