import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { pool } from './db.js'

// Rodando via tsx o arquivo está em api/src; compilado, em api/dist/src.
const migrationsDir = ['../db/migrations/', '../../db/migrations/']
  .map((rel) => fileURLToPath(new URL(rel, import.meta.url)))
  .find((dir) => existsSync(dir))!

// Aplica, em ordem, os arquivos .sql de db/migrations que ainda não rodaram.
export async function migrate() {
  const files = await readdir(migrationsDir)

  const client = await pool.connect()
  try {
    await client.query(`create table if not exists schema_migrations (
      nome text primary key,
      aplicada_em timestamptz not null default now()
    )`)
    const { rows } = await client.query<{ nome: string }>('select nome from schema_migrations')
    const applied = new Set(rows.map((r) => r.nome))

    for (const file of files.filter((f) => f.endsWith('.sql')).sort()) {
      if (applied.has(file)) continue
      const sql = await readFile(migrationsDir + file, 'utf8')
      await client.query('begin')
      try {
        await client.query(sql)
        await client.query('insert into schema_migrations (nome) values ($1)', [file])
        await client.query('commit')
        console.log(`migração aplicada: ${file}`)
      } catch (err) {
        await client.query('rollback')
        throw err
      }
    }
  } finally {
    client.release()
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  migrate()
    .then(() => console.log('banco atualizado'))
    .catch((err) => {
      console.error(err)
      process.exitCode = 1
    })
    .finally(() => pool.end())
}
