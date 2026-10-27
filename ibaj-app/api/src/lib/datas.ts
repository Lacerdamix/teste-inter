import { config } from '../config.js'

const ymdFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: config.timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const offsetFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: config.timeZone,
  timeZoneName: 'longOffset',
})

/** Data local da igreja (YYYY-MM-DD) para um instante. */
export function dataLocal(instante = new Date()): string {
  return ymdFormat.format(instante)
}

export function somarDias(ymd: string, dias: number): string {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Instante da meia-noite local de uma data YYYY-MM-DD. */
export function inicioDoDia(ymd: string): Date {
  const meioDia = new Date(`${ymd}T12:00:00Z`)
  const nome = offsetFormat.formatToParts(meioDia).find((p) => p.type === 'timeZoneName')!.value
  const offset = nome === 'GMT' ? '+00:00' : nome.slice(3)
  return new Date(`${ymd}T00:00:00${offset}`)
}
