export type Registro = Record<string, unknown> & { id: string }

export interface Campo {
  nome: string
  rotulo: string
  tipo: 'texto' | 'textarea' | 'url' | 'numero' | 'data' | 'dataHora' | 'check' | 'lista' | 'opcoes' | 'membro'
  obrigatorio?: boolean
  opcoes?: { valor: string; rotulo: string }[]
  /** Valor de um registro novo; função é avaliada ao abrir o formulário. */
  padrao?: unknown
  ajuda?: string
  min?: number
  max?: number
}

interface Formatadores {
  diaMesCurto(data: string): string
  hora(instante: string): string
}

interface Recurso {
  rotulo: string
  singular: string
  podeCriar: boolean
  campos: Campo[]
  resumo(registro: Registro, f: Formatadores): { titulo: string; detalhe: string }
}

const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

const categorias = [
  { valor: 'igreja', rotulo: 'Igreja' },
  { valor: 'ministerios', rotulo: 'Ministérios' },
  { valor: 'eventos', rotulo: 'Eventos' },
]

const tiposConteudo = [
  { valor: 'devocional', rotulo: 'Devocional' },
  { valor: 'pregacao', rotulo: 'Pregação' },
  { valor: 'artigo', rotulo: 'Artigo' },
]

const recorrencias = [
  { valor: 'nenhuma', rotulo: 'Não se repete' },
  { valor: 'semanal', rotulo: 'Toda semana' },
  { valor: 'quinzenal', rotulo: 'A cada duas semanas' },
]

export type ChaveRecurso = 'avisos' | 'eventos' | 'conteudos' | 'membros' | 'usuarios'

export const recursos: Record<ChaveRecurso, Recurso> = {
  avisos: {
    rotulo: 'Avisos',
    singular: 'aviso',
    podeCriar: true,
    campos: [
      { nome: 'titulo', rotulo: 'Título', tipo: 'texto', obrigatorio: true },
      { nome: 'texto', rotulo: 'Texto', tipo: 'textarea', obrigatorio: true },
      { nome: 'categoria', rotulo: 'Categoria', tipo: 'opcoes', opcoes: categorias, padrao: 'igreja' },
      { nome: 'origem', rotulo: 'Quem publica', tipo: 'texto', ajuda: 'Aparece acima do título, por exemplo "Secretaria" ou "Ação social".' },
      { nome: 'imagem_url', rotulo: 'Imagem (link)', tipo: 'url' },
      { nome: 'cta_texto', rotulo: 'Texto do botão', tipo: 'texto', ajuda: 'Opcional. Preencha junto com o link.' },
      { nome: 'cta_link', rotulo: 'Link do botão', tipo: 'url' },
      { nome: 'fixado', rotulo: 'Fixar no topo', tipo: 'check' },
      { nome: 'publicado_em', rotulo: 'Publicar em', tipo: 'dataHora', padrao: () => new Date().toISOString() },
      { nome: 'expira_em', rotulo: 'Sai do ar em', tipo: 'dataHora', ajuda: 'Deixe vazio para manter até ser excluído.' },
    ],
    resumo: (r, f) => ({
      titulo: String(r.titulo),
      detalhe: [r.fixado && 'Fixado', f.diaMesCurto(String(r.publicado_em))].filter(Boolean).join(', '),
    }),
  },
  eventos: {
    rotulo: 'Eventos',
    singular: 'evento',
    podeCriar: true,
    campos: [
      { nome: 'titulo', rotulo: 'Título', tipo: 'texto', obrigatorio: true },
      { nome: 'descricao', rotulo: 'Descrição curta', tipo: 'texto' },
      { nome: 'local', rotulo: 'Local', tipo: 'texto', padrao: 'IBaj, Jaraguá' },
      { nome: 'inicio', rotulo: 'Início (primeira data)', tipo: 'dataHora', obrigatorio: true },
      { nome: 'fim', rotulo: 'Fim', tipo: 'dataHora' },
      { nome: 'recorrencia', rotulo: 'Repetição', tipo: 'opcoes', opcoes: recorrencias, padrao: 'nenhuma' },
      { nome: 'destaque', rotulo: 'Culto principal (aparece como "Próximo culto")', tipo: 'check' },
    ],
    resumo: (r, f) => ({
      titulo: String(r.titulo),
      detalhe: [
        recorrencias.find((o) => o.valor === r.recorrencia)?.rotulo,
        `desde ${f.diaMesCurto(String(r.inicio))}, ${f.hora(String(r.inicio))}`,
      ].join(', '),
    }),
  },
  conteudos: {
    rotulo: 'Conteúdos',
    singular: 'conteúdo',
    podeCriar: true,
    campos: [
      { nome: 'tipo', rotulo: 'Tipo', tipo: 'opcoes', opcoes: tiposConteudo, padrao: 'devocional' },
      { nome: 'titulo', rotulo: 'Título', tipo: 'texto', obrigatorio: true },
      { nome: 'autor', rotulo: 'Autor', tipo: 'texto' },
      { nome: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true, padrao: hoje, ajuda: 'Só aparece no app a partir desta data.' },
      { nome: 'referencia', rotulo: 'Referência bíblica', tipo: 'texto', ajuda: 'Por exemplo "Salmos 23".' },
      { nome: 'versiculo_texto', rotulo: 'Versículo em destaque', tipo: 'textarea' },
      { nome: 'versiculo_ref', rotulo: 'Referência do versículo', tipo: 'texto' },
      { nome: 'corpo', rotulo: 'Texto', tipo: 'textarea', ajuda: 'Separe os parágrafos com uma linha em branco.' },
      { nome: 'oracao', rotulo: 'Para orar', tipo: 'textarea' },
      { nome: 'video_url', rotulo: 'Vídeo (link do YouTube)', tipo: 'url' },
      { nome: 'duracao_min', rotulo: 'Duração em minutos', tipo: 'numero', min: 1 },
      { nome: 'publicado', rotulo: 'Publicado', tipo: 'check', padrao: true },
    ],
    resumo: (r, f) => ({
      titulo: String(r.titulo),
      detalhe: [
        tiposConteudo.find((o) => o.valor === r.tipo)?.rotulo,
        f.diaMesCurto(String(r.data)),
        !r.publicado && 'Rascunho',
      ].filter(Boolean).join(', '),
    }),
  },
  membros: {
    rotulo: 'Membros',
    singular: 'membro',
    podeCriar: true,
    campos: [
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
      { nome: 'cargo', rotulo: 'Cargo', tipo: 'texto', ajuda: 'Por exemplo "Diácono" ou "Presbítero".' },
      { nome: 'lideranca', rotulo: 'Faz parte da liderança', tipo: 'check' },
      { nome: 'ministerios', rotulo: 'Ministérios', tipo: 'lista', ajuda: 'Separe por vírgula: Homens, Mulheres, Jovens, Ação Social.' },
      { nome: 'aniversario_dia', rotulo: 'Dia do aniversário', tipo: 'numero', min: 1, max: 31 },
      { nome: 'aniversario_mes', rotulo: 'Mês do aniversário', tipo: 'numero', min: 1, max: 12 },
      { nome: 'telefone', rotulo: 'WhatsApp', tipo: 'texto', ajuda: 'Com DDD, por exemplo 31 99999 0000.' },
      { nome: 'email', rotulo: 'E-mail', tipo: 'texto' },
      { nome: 'foto_url', rotulo: 'Foto (link)', tipo: 'url' },
      { nome: 'visivel_no_hall', rotulo: 'Aparece no hall de membros', tipo: 'check', padrao: true },
    ],
    resumo: (r) => ({
      titulo: String(r.nome),
      detalhe: [r.cargo, ...((r.ministerios as string[]) ?? []), !r.visivel_no_hall && 'Oculto no hall']
        .filter(Boolean)
        .join(', ') || 'Membro',
    }),
  },
  usuarios: {
    rotulo: 'Contas',
    singular: 'conta',
    podeCriar: false,
    campos: [
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
      { nome: 'aprovado', rotulo: 'Cadastro aprovado (libera o hall de membros)', tipo: 'check' },
      {
        nome: 'papel',
        rotulo: 'Papel',
        tipo: 'opcoes',
        opcoes: [
          { valor: 'membro', rotulo: 'Membro' },
          { valor: 'admin', rotulo: 'Secretaria (acesso ao painel)' },
        ],
      },
      { nome: 'membro_id', rotulo: 'Cadastro de membro', tipo: 'membro', ajuda: 'Vincule para a pessoa controlar a própria visibilidade no hall.' },
    ],
    resumo: (r) => ({
      titulo: String(r.nome),
      detalhe: [r.email, r.papel === 'admin' ? 'Secretaria' : null, r.aprovado ? null : 'Aguardando aprovação']
        .filter(Boolean)
        .join(', '),
    }),
  },
}
