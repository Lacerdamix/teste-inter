import bcrypt from 'bcryptjs'
import { pathToFileURL } from 'node:url'
import { pool, queryOne } from './db.js'
import { dataLocal, inicioDoDia, somarDias } from './lib/datas.js'
import { migrate } from './migrate.js'

// Dados de exemplo para desenvolvimento. Horários e conteúdo dos encontros vêm
// do site da IBaj; nomes de membros e avisos são fictícios.

const hoje = dataLocal()

/** Última data (até hoje) que cai no dia da semana indicado (0 = domingo). */
function ultimo(diaDaSemana: number, semanasAtras = 0) {
  const atual = new Date(`${hoje}T12:00:00Z`).getUTCDay()
  return somarDias(hoje, -((atual - diaDaSemana + 7) % 7) - semanasAtras * 7)
}

function em(data: string, hora: string) {
  const [h, m = '0'] = hora.split(':')
  return new Date(inicioDoDia(data).getTime() + (Number(h) * 60 + Number(m)) * 60_000)
}

function aniversario(diasAPartirDeHoje: number) {
  const [, mes, dia] = somarDias(hoje, diasAPartirDeHoje).split('-').map(Number)
  return { dia, mes }
}

async function seed() {
  const reset = process.argv.includes('--reset')
  await migrate()

  const existente = await queryOne<{ total: number }>('select count(*)::int as total from usuarios')
  if (existente!.total > 0 && !reset) {
    console.log('O banco já tem dados. Rode "npm run db:seed -- --reset" para apagar tudo e recriar.')
    return
  }

  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query(
      'truncate devocionais_lidos, favoritos, lembretes, usuarios, membros, avisos, eventos, conteudos cascade',
    )

    // Eventos: a data guardada é a primeira ocorrência; a recorrência gera as próximas.
    const eventos: [string, string | null, string | null, Date, Date | null, string, boolean][] = [
      ['Culto Dominical', 'Café antes do culto', 'IBaj, Jaraguá', em(ultimo(0, 4), '10:30'), em(ultimo(0, 4), '12:00'), 'semanal', true],
      ['Escola Bíblica Dominical', 'Para todas as idades', 'IBaj, Jaraguá', em(ultimo(0, 4), '9:00'), em(ultimo(0, 4), '10:15'), 'semanal', false],
      ['Encontro de Jovens', null, 'IBaj, Jaraguá', em(ultimo(6, 4), '19:30'), em(ultimo(6, 4), '21:30'), 'semanal', false],
      ['Encontro de Homens', 'Quinzenal, confirme com a secretaria', 'IBaj, Jaraguá', em(ultimo(4, 4), '20:00'), null, 'quinzenal', false],
      ['No Caminho', 'Quinzenal, confirme com a secretaria', 'IBaj, Jaraguá', em(ultimo(4, 3), '20:00'), null, 'quinzenal', false],
      ['Encontro de Mulheres', 'Quinzenal, confirme com a secretaria', 'IBaj, Jaraguá', em(ultimo(3, 4), '19:30'), null, 'quinzenal', false],
    ]
    for (const e of eventos) {
      await client.query(
        `insert into eventos (titulo, descricao, local, inicio, fim, recorrencia, destaque)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        e,
      )
    }

    const avisos = [
      {
        titulo: 'Inscrições abertas para o Batismo',
        texto: 'As aulas preparatórias começam em novembro. Faça sua inscrição até o dia 15 na secretaria ou pelo app.',
        categoria: 'igreja', origem: 'Secretaria', fixado: true, dias: 2,
        cta_texto: 'Quero me inscrever', cta_link: 'https://ibaj.com.br',
      },
      {
        titulo: 'Campanha do Agasalho',
        texto: 'Traga roupas e cobertores em bom estado. Os pontos de coleta ficam no hall de entrada.',
        categoria: 'ministerios', origem: 'Ação social', fixado: false, dias: 1,
      },
      {
        titulo: 'Encontro de Mulheres nesta quarta',
        texto: 'Quarta, às 19h30. O encontro é quinzenal, confirme as datas com a secretaria.',
        categoria: 'eventos', origem: 'Ministério de Mulheres', fixado: false, dias: 3,
      },
      {
        titulo: 'Novo horário de atendimento',
        texto: 'A secretaria passa a atender de terça a sexta, das 9h às 17h.',
        categoria: 'igreja', origem: 'Secretaria', fixado: false, dias: 5,
      },
    ]
    for (const a of avisos) {
      await client.query(
        `insert into avisos (titulo, texto, categoria, origem, fixado, cta_texto, cta_link, publicado_em)
         values ($1, $2, $3, $4, $5, $6, $7, now() - make_interval(days => $8))`,
        [a.titulo, a.texto, a.categoria, a.origem, a.fixado, a.cta_texto ?? null, a.cta_link ?? null, a.dias],
      )
    }

    const conteudos = [
      {
        tipo: 'devocional', titulo: 'Descanso que vem de Deus', autor: 'Equipe pastoral', data: hoje,
        referencia: 'Salmos 23', duracao_min: 4,
        versiculo_texto: 'O Senhor é o meu pastor; nada me faltará.', versiculo_ref: 'Salmos 23.1',
        corpo: [
          'Davi conhecia bem a rotina de um pastor de ovelhas. Ele sabia que o rebanho não descansa por conta própria: deita quando se sente seguro, alimentado e protegido.',
          'Quando o salmista diz que nada lhe faltará, ele não está descrevendo uma vida sem lutas, e sim a presença constante de alguém que cuida de cada detalhe.',
          '[Texto do devocional continua aqui, enviado pela equipe pastoral]',
        ].join('\n\n'),
        oracao: 'Senhor, ensina-me a descansar em ti hoje, confiando que o teu cuidado alcança cada área da minha vida.',
      },
      {
        tipo: 'devocional', titulo: 'Força para o dia mau', autor: 'Equipe pastoral', data: somarDias(hoje, -1),
        referencia: 'Efésios 6', duracao_min: 5,
        versiculo_texto: 'Revesti-vos de toda a armadura de Deus, para que possais estar firmes contra as ciladas do diabo.',
        versiculo_ref: 'Efésios 6.11',
        corpo: '[Texto do devocional, enviado pela equipe pastoral]',
        oracao: 'Senhor, firma meus pés na tua verdade e guarda o meu coração hoje.',
      },
      {
        tipo: 'pregacao', titulo: 'A fé que permanece', autor: '[Nome do pastor]', data: ultimo(0),
        referencia: 'Hebreus 11', duracao_min: 52, video_url: 'https://www.youtube.com/',
      },
      {
        tipo: 'pregacao', titulo: 'Chamados para servir', autor: '[Nome do pastor]', data: ultimo(0, 1),
        referencia: 'Marcos 10', duracao_min: 47, video_url: 'https://www.youtube.com/',
      },
      {
        tipo: 'artigo', titulo: 'Por que somos uma igreja confessional', autor: '[Nome do pastor]', data: somarDias(hoje, -6),
        referencia: null, duracao_min: 6,
        corpo: '[Texto do artigo, publicado também no site da IBaj]',
      },
    ]
    const ids: string[] = []
    for (const c of conteudos) {
      const { rows } = await client.query<{ id: string }>(
        `insert into conteudos (tipo, titulo, autor, data, referencia, duracao_min, versiculo_texto, versiculo_ref, corpo, oracao, video_url)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning id`,
        [c.tipo, c.titulo, c.autor, c.data, c.referencia, c.duracao_min, c.versiculo_texto ?? null,
          c.versiculo_ref ?? null, c.corpo ?? null, c.oracao ?? null, c.video_url ?? null],
      )
      ids.push(rows[0].id)
    }

    const membros: [string, string[], string | null, boolean, { dia: number; mes: number } | null, string | null][] = [
      ['Mariana Alves', ['Mulheres'], null, false, aniversario(40), '31999990000'],
      ['Carla Ribeiro', ['Mulheres'], null, false, aniversario(0), null],
      ['Paulo Henrique', ['Homens'], 'Presbítero', true, aniversario(1), null],
      ['Lúcia Moreira', ['Ação Social'], null, false, aniversario(3), null],
      ['Rafael Santos', ['Jovens'], null, false, aniversario(6), null],
      ['Ana Beatriz Lima', ['Louvor'], null, false, aniversario(90), '31999990001'],
      ['André Carvalho', [], 'Diácono', true, aniversario(120), '31999990002'],
      ['Bruno Ferreira', ['Jovens'], null, false, aniversario(150), null],
      ['Camila Rocha', ['Mulheres'], null, false, aniversario(200), null],
      ['Daniel Souza', ['Ação Social'], null, false, aniversario(250), null],
      ['Eliane Martins', ['Mulheres'], null, false, aniversario(300), null],
    ]
    const membroIds: string[] = []
    for (const [nome, ministerios, cargo, lideranca, aniv, telefone] of membros) {
      const { rows } = await client.query<{ id: string }>(
        `insert into membros (nome, ministerios, cargo, lideranca, aniversario_dia, aniversario_mes, telefone)
         values ($1, $2, $3, $4, $5, $6, $7) returning id`,
        [nome, ministerios, cargo, lideranca, aniv?.dia ?? null, aniv?.mes ?? null, telefone],
      )
      membroIds.push(rows[0].id)
    }

    const adminEmail = process.env.ADMIN_EMAIL ?? 'secretaria@ibaj.com.br'
    const adminSenha = process.env.ADMIN_PASSWORD ?? 'ibaj-secretaria'
    await client.query(
      `insert into usuarios (nome, email, senha_hash, papel, aprovado) values ('Secretaria', $1, $2, 'admin', true)`,
      [adminEmail, await bcrypt.hash(adminSenha, 10)],
    )
    const { rows } = await client.query<{ id: string }>(
      `insert into usuarios (nome, email, senha_hash, aprovado, membro_id)
       values ('Mariana Alves', 'mariana@exemplo.com', $1, true, $2) returning id`,
      [await bcrypt.hash('ibaj1234', 10), membroIds[0]],
    )
    await client.query('insert into favoritos (usuario_id, conteudo_id) values ($1, $2)', [rows[0].id, ids[1]])

    await client.query('commit')
    console.log('Dados de exemplo criados.')
    console.log(`  Secretaria: ${adminEmail} / ${adminSenha}`)
    console.log('  Membro:     mariana@exemplo.com / ibaj1234')
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed()
    .catch((err) => {
      console.error(err)
      process.exitCode = 1
    })
    .finally(() => pool.end())
}
