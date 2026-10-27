export type Categoria = 'igreja' | 'ministerios' | 'eventos'
export type TipoConteudo = 'pregacao' | 'devocional' | 'artigo'

export interface Usuario {
  id: string
  nome: string
  email: string
  papel: 'membro' | 'admin'
  aprovado: boolean
  membro_id: string | null
  membro?: { id: string; nome: string; visivel_no_hall: boolean } | null
}

export interface Aviso {
  id: string
  titulo: string
  texto: string
  categoria: Categoria
  origem: string | null
  imagem_url?: string | null
  cta_texto?: string | null
  cta_link?: string | null
  fixado: boolean
  publicado_em: string
}

export interface Ocorrencia {
  id: string
  titulo: string
  descricao: string | null
  local: string | null
  recorrencia: 'nenhuma' | 'semanal' | 'quinzenal'
  destaque: boolean
  inicio: string
  fim: string | null
  lembrete: boolean
}

export interface ConteudoResumo {
  id: string
  tipo: TipoConteudo
  titulo: string
  autor: string | null
  data: string
  referencia: string | null
  video_url: string | null
  duracao_min: number | null
}

export interface Conteudo extends ConteudoResumo {
  versiculo_texto: string | null
  versiculo_ref: string | null
  corpo: string | null
  oracao: string | null
  lido: boolean
  favorito: boolean
}

export interface Membro {
  id: string
  nome: string
  foto_url: string | null
  aniversario_dia: number | null
  aniversario_mes: number | null
  ministerios: string[]
  cargo: string | null
  lideranca: boolean
  telefone: string | null
  email: string | null
}

export interface Inicio {
  proximoCulto: Ocorrencia | null
  semana: Ocorrencia[]
  devocional: ConteudoResumo | null
  avisos: Aviso[]
  ultimoAvisoEm: string | null
}
