import pg from 'pg'
import { config } from './config.js'

// date (sem hora) volta como string "YYYY-MM-DD" em vez de Date em fuso local.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value)

export const pool = new pg.Pool({ connectionString: config.databaseUrl })

export async function query<T extends pg.QueryResultRow>(text: string, params: unknown[] = []) {
  const result = await pool.query<T>(text, params)
  return result.rows
}

export async function queryOne<T extends pg.QueryResultRow>(text: string, params: unknown[] = []) {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}
