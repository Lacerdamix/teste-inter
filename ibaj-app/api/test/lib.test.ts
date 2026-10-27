import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { aniversariantesDaSemana } from '../src/lib/aniversarios.js'
import { inicioDoDia, somarDias } from '../src/lib/datas.js'
import { gerarIcs } from '../src/lib/ics.js'

describe('datas', () => {
  it('meia-noite em Belo Horizonte é 03h UTC', () => {
    assert.equal(inicioDoDia('2026-10-22').toISOString(), '2026-10-22T03:00:00.000Z')
  })

  it('soma dias atravessando mês e ano', () => {
    assert.equal(somarDias('2026-12-30', 3), '2027-01-02')
    assert.equal(somarDias('2026-03-01', -1), '2026-02-28')
  })
})

describe('aniversariantes da semana', () => {
  const membro = (nome: string, dia: number, mes: number) => ({ nome, aniversario_dia: dia, aniversario_mes: mes })

  it('lista os próximos 7 dias em ordem, incluindo a virada do ano', () => {
    const lista = aniversariantesDaSemana(
      [membro('Ano novo', 2, 1), membro('Hoje', 29, 12), membro('Fora', 6, 1), membro('Véspera', 31, 12)],
      '2026-12-29',
    )
    assert.deepEqual(
      lista.map((m) => [m.nome, m.aniversario_data]),
      [['Hoje', '2026-12-29'], ['Véspera', '2026-12-31'], ['Ano novo', '2027-01-02']],
    )
  })

  it('lembra quem nasceu em 29/02 no dia 28 em anos não bissextos', () => {
    const lista = aniversariantesDaSemana([membro('Bissexto', 29, 2)], '2027-02-25')
    assert.equal(lista[0]?.aniversario_data, '2027-02-28')
  })

  it('ignora quem não informou aniversário', () => {
    assert.equal(aniversariantesDaSemana([{ aniversario_dia: null, aniversario_mes: null }], '2026-01-01').length, 0)
  })
})

describe('arquivo de calendário', () => {
  const evento = {
    id: 'abc',
    titulo: 'Encontro de Homens',
    descricao: 'Quinzenal; confirme com a secretaria',
    local: 'IBaj, Jaraguá',
    inicio: new Date('2026-10-22T23:00:00Z'),
    fim: null,
    recorrencia: 'quinzenal' as const,
  }

  it('repete a cada duas semanas e usa 1h30 como duração padrão', () => {
    const ics = gerarIcs(evento)
    assert.match(ics, /RRULE:FREQ=WEEKLY;INTERVAL=2\r\n/)
    assert.match(ics, /DTSTART:20261022T230000Z/)
    assert.match(ics, /DTEND:20261023T003000Z/)
  })

  it('escapa vírgula e ponto e vírgula', () => {
    const ics = gerarIcs(evento)
    assert.ok(ics.includes('LOCATION:IBaj\\, Jaraguá'))
    assert.ok(ics.includes('DESCRIPTION:Quinzenal\\; confirme'))
  })
})
