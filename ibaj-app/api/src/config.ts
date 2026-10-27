import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// O .env fica na raiz do monorepo, compartilhado com o front.
const envFile = fileURLToPath(new URL('../../.env', import.meta.url))
const envFileFromDist = fileURLToPath(new URL('../../../.env', import.meta.url))
for (const file of [envFile, envFileFromDist]) {
  if (existsSync(file)) {
    process.loadEnvFile(file)
    break
  }
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) throw new Error(`Variável de ambiente ${name} não definida`)
  return value
}

const isProduction = process.env.NODE_ENV === 'production'

export const config = {
  databaseUrl: required('DATABASE_URL', 'postgres://ibaj:ibaj@localhost:5432/ibaj'),
  // Em produção o segredo é obrigatório; em dev um valor fixo evita atrito.
  jwtSecret: required('JWT_SECRET', isProduction ? undefined : 'dev-secret'),
  port: Number(process.env.PORT ?? 3001),
  timeZone: 'America/Sao_Paulo',
  isProduction,
}
