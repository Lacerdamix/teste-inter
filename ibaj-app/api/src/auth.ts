import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from './config.js'
import { queryOne } from './db.js'

export type Papel = 'membro' | 'admin'

export interface Usuario {
  id: string
  nome: string
  email: string
  papel: Papel
  aprovado: boolean
  membro_id: string | null
}

declare global {
  namespace Express {
    interface Request {
      usuario?: Usuario
    }
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export function signToken(usuarioId: string) {
  return jwt.sign({ sub: usuarioId }, config.jwtSecret, { expiresIn: '30d' })
}

// Lê o token se houver; rotas públicas usam isso para personalizar a resposta.
export async function carregarUsuario(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next()
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as { sub: string }
    const usuario = await queryOne<Usuario>(
      'select id, nome, email, papel, aprovado, membro_id from usuarios where id = $1',
      [payload.sub],
    )
    if (usuario) req.usuario = usuario
  } catch {
    // Token inválido ou expirado: segue como visitante.
  }
  next()
}

export function exigirLogin(req: Request, _res: Response, next: NextFunction) {
  if (!req.usuario) throw new HttpError(401, 'Entre com sua conta para continuar')
  next()
}

// Dados de outros membros (hall) só para quem a secretaria já aprovou.
export function exigirMembroAprovado(req: Request, _res: Response, next: NextFunction) {
  if (!req.usuario) throw new HttpError(401, 'Entre com sua conta para ver os membros')
  if (!req.usuario.aprovado) throw new HttpError(403, 'Seu cadastro está aguardando aprovação da secretaria')
  next()
}

export function exigirAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.usuario) throw new HttpError(401, 'Entre com sua conta para continuar')
  if (req.usuario.papel !== 'admin') throw new HttpError(403, 'Acesso restrito à secretaria')
  next()
}
