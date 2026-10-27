// Datas sempre no fuso da igreja, independente do fuso do aparelho.
const FUSO = 'America/Sao_Paulo'

function partes(data: Date | string, opcoes: Intl.DateTimeFormatOptions) {
  const d = typeof data === 'string' ? new Date(data) : data
  return Object.fromEntries(
    new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, ...opcoes }).formatToParts(d).map((p) => [p.type, p.value]),
  ) as Record<string, string>
}

function capitalizar(texto: string) {
  return texto.charAt(0).toLocaleUpperCase('pt-BR') + texto.slice(1)
}

/** "2026-10-22" para um instante, no fuso da igreja. */
export function dataLocal(instante: Date | string = new Date()) {
  const p = partes(instante, { year: 'numeric', month: '2-digit', day: '2-digit' })
  return `${p.year}-${p.month}-${p.day}`
}

export function somarDias(ymd: string, dias: number) {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Datas "YYYY-MM-DD" viram meio-dia UTC para não escorregar de dia em nenhum fuso. */
function deData(ymd: string) {
  return new Date(`${ymd}T12:00:00Z`)
}

/** "10h30", "9h" */
export function hora(instante: string) {
  const p = partes(instante, { hour: 'numeric', minute: '2-digit', hour12: false })
  const h = String(Number(p.hour))
  return p.minute === '00' ? `${h}h` : `${h}h${p.minute}`
}

/** "Qui" */
export function diaSemanaCurto(ymd: string) {
  return capitalizar(partes(deData(ymd), { weekday: 'short' }).weekday.replace('.', ''))
}

/** "Sábado, 24" */
export function diaSemanaENumero(ymd: string) {
  const p = partes(deData(ymd), { weekday: 'long', day: 'numeric' })
  return `${capitalizar(p.weekday.split('-')[0])}, ${p.day}`
}

/** "Sáb, 24" */
export function diaCurtoENumero(ymd: string) {
  return `${diaSemanaCurto(ymd)}, ${Number(ymd.slice(8))}`
}

/** "Domingo, 25 de outubro" */
export function dataPorExtenso(ymdOuInstante: string) {
  const d = ymdOuInstante.length === 10 ? deData(ymdOuInstante) : new Date(ymdOuInstante)
  const p = partes(d, { weekday: 'long', day: 'numeric', month: 'long' })
  return `${capitalizar(p.weekday.split('-')[0])}, ${p.day} de ${p.month}`
}

/** "19 de out" */
export function diaMesCurto(ymdOuInstante: string) {
  const d = ymdOuInstante.length === 10 ? deData(ymdOuInstante) : new Date(ymdOuInstante)
  const p = partes(d, { day: 'numeric', month: 'short' })
  return `${p.day} de ${p.month.replace('.', '')}`
}

/** "out" */
export function mesCurto(ymd: string) {
  return partes(deData(ymd), { month: 'short' }).month.replace('.', '')
}

/** "Outubro" */
export function nomeDoMes(ymd: string) {
  return capitalizar(partes(deData(ymd), { month: 'long' }).month)
}

/** "hoje", "ontem", "há 3 dias" ou "18 de out" */
export function relativo(instante: string) {
  const dias = Math.round(
    (deData(dataLocal()).getTime() - deData(dataLocal(instante)).getTime()) / 86_400_000,
  )
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias < 7) return `há ${dias} dias`
  return diaMesCurto(instante)
}

export function saudacao() {
  const h = Number(partes(new Date(), { hour: 'numeric', hour12: false }).hour)
  if (h < 12) return 'Bom dia,'
  if (h < 18) return 'Boa tarde,'
  return 'Boa noite,'
}

export function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0]
}

export function iniciais(nome: string) {
  const partesNome = nome.trim().split(/\s+/)
  const ultima = partesNome.length > 1 ? partesNome[partesNome.length - 1] : ''
  return (partesNome[0].charAt(0) + ultima.charAt(0)).toLocaleUpperCase('pt-BR')
}

/** Valor para <input type="datetime-local"> no fuso da igreja. */
export function paraCampoDataHora(instante: string | null) {
  if (!instante) return ''
  const p = partes(instante, {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  })
  return `${p.year}-${p.month}-${p.day}T${p.hour === '24' ? '00' : p.hour}:${p.minute}`
}

/** Converte o valor de um datetime-local (horário da igreja) para ISO. */
export function deCampoDataHora(valor: string) {
  if (!valor) return null
  const nome = partes(new Date(`${valor.slice(0, 10)}T12:00:00Z`), { timeZoneName: 'longOffset' }).timeZoneName
  const offset = nome === 'GMT' ? '+00:00' : nome.slice(3)
  return new Date(`${valor}:00${offset}`).toISOString()
}
