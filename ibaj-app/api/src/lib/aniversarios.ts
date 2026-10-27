import { dataLocal, somarDias } from './datas.js'

interface ComAniversario {
  aniversario_dia: number | null
  aniversario_mes: number | null
}

/**
 * Membros que fazem aniversário de hoje até daqui a 6 dias, em ordem.
 * Quem nasceu em 29/02 é lembrado em 28/02 nos anos não bissextos.
 */
export function aniversariantesDaSemana<T extends ComAniversario>(membros: T[], hoje = dataLocal()) {
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(hoje, i))
  const resultado: (T & { aniversario_data: string })[] = []
  for (const data of dias) {
    const [ano, mes, dia] = data.split('-').map(Number)
    const bissexto = (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0
    for (const m of membros) {
      if (m.aniversario_mes !== mes) continue
      const diaComemorado = m.aniversario_dia === 29 && mes === 2 && !bissexto ? 28 : m.aniversario_dia
      if (diaComemorado === dia) resultado.push({ ...m, aniversario_data: data })
    }
  }
  return resultado
}
