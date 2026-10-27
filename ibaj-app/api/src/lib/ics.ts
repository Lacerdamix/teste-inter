interface EventoIcs {
  id: string
  titulo: string
  descricao: string | null
  local: string | null
  inicio: Date
  fim: Date | null
  recorrencia: 'nenhuma' | 'semanal' | 'quinzenal'
}

const DURACAO_PADRAO_MS = 90 * 60 * 1000

function dataIcs(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapar(texto: string) {
  return texto.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
}

/** Arquivo .ics de um evento, com regra de repetição quando for recorrente. */
export function gerarIcs(evento: EventoIcs) {
  const fim = evento.fim ?? new Date(evento.inicio.getTime() + DURACAO_PADRAO_MS)
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IBaj//App IBaj//PT-BR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${evento.id}@ibaj.com.br`,
    `DTSTAMP:${dataIcs(new Date())}`,
    `DTSTART:${dataIcs(evento.inicio)}`,
    `DTEND:${dataIcs(fim)}`,
    `SUMMARY:${escapar(evento.titulo)}`,
  ]
  if (evento.descricao) linhas.push(`DESCRIPTION:${escapar(evento.descricao)}`)
  linhas.push(`LOCATION:${escapar(evento.local ?? 'Igreja Batista do Jaraguá')}`)
  if (evento.recorrencia === 'semanal') linhas.push('RRULE:FREQ=WEEKLY')
  if (evento.recorrencia === 'quinzenal') linhas.push('RRULE:FREQ=WEEKLY;INTERVAL=2')
  linhas.push('END:VEVENT', 'END:VCALENDAR')
  return linhas.join('\r\n') + '\r\n'
}
