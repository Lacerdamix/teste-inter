import { query } from '../db.js'

export interface Ocorrencia {
  id: string
  titulo: string
  descricao: string | null
  local: string | null
  recorrencia: 'nenhuma' | 'semanal' | 'quinzenal'
  destaque: boolean
  inicio: Date
  fim: Date | null
  lembrete: boolean
}

interface Opcoes {
  de: Date
  ate: Date
  somenteDestaque?: boolean
  limite?: number
  usuarioId?: string
}

/**
 * Expande eventos recorrentes em ocorrências dentro de [de, ate).
 * Cada evento guarda só a primeira data; as demais são geradas aqui.
 */
export async function listarOcorrencias({ de, ate, somenteDestaque, limite, usuarioId }: Opcoes) {
  return query<Ocorrencia>(
    `select e.id, e.titulo, e.descricao, e.local, e.recorrencia, e.destaque,
            o.inicio,
            case when e.fim is null then null else o.inicio + (e.fim - e.inicio) end as fim,
            exists (
              select 1 from lembretes l where l.evento_id = e.id and l.usuario_id = $3
            ) as lembrete
       from eventos e
       cross join lateral (
         select gs as inicio
           from generate_series(
             e.inicio, $2::timestamptz,
             case e.recorrencia when 'quinzenal' then interval '14 days' else interval '7 days' end
           ) gs
          where e.recorrencia <> 'nenhuma'
         union all
         select e.inicio where e.recorrencia = 'nenhuma'
       ) o
      where o.inicio >= $1 and o.inicio < $2
        and ($4::boolean is not true or e.destaque)
      order by o.inicio, e.titulo
      limit $5`,
    [de, ate, usuarioId ?? null, somenteDestaque ?? false, limite ?? null],
  )
}
