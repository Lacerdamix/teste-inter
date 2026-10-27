-- Esquema inicial do app IBaj.
-- Horários são gravados em timestamptz e exibidos em America/Sao_Paulo.

create table membros (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  foto_url         text,
  -- Só dia e mês (LGPD): o ano de nascimento não é armazenado.
  aniversario_dia  smallint check (aniversario_dia between 1 and 31),
  aniversario_mes  smallint check (aniversario_mes between 1 and 12),
  ministerios      text[] not null default '{}',
  cargo            text,
  lideranca        boolean not null default false,
  telefone         text,
  email            text,
  visivel_no_hall  boolean not null default true,
  criado_em        timestamptz not null default now(),
  check ((aniversario_dia is null) = (aniversario_mes is null))
);

create table usuarios (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  email       text not null,
  senha_hash  text not null,
  papel       text not null default 'membro' check (papel in ('membro', 'admin')),
  -- Cadastro feito pelo app fica pendente até a secretaria aprovar.
  aprovado    boolean not null default false,
  membro_id   uuid unique references membros (id) on delete set null,
  criado_em   timestamptz not null default now()
);
create unique index usuarios_email_idx on usuarios (lower(email));

create table avisos (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  texto         text not null,
  categoria     text not null check (categoria in ('igreja', 'ministerios', 'eventos')),
  -- Quem publica, exibido acima do título ("Secretaria", "Ação social").
  origem        text,
  imagem_url    text,
  cta_texto     text,
  cta_link      text,
  fixado        boolean not null default false,
  publicado_em  timestamptz not null default now(),
  expira_em     timestamptz,
  check ((cta_texto is null) = (cta_link is null))
);
create index avisos_publicado_idx on avisos (publicado_em desc);

create table eventos (
  id           uuid primary key default gen_random_uuid(),
  titulo       text not null,
  descricao    text,
  local        text,
  -- Primeira ocorrência; eventos recorrentes se repetem a partir dela.
  inicio       timestamptz not null,
  fim          timestamptz,
  recorrencia  text not null default 'nenhuma' check (recorrencia in ('nenhuma', 'semanal', 'quinzenal')),
  -- Destaque marca o culto principal (card "Próximo culto" e ações na agenda).
  destaque     boolean not null default false,
  check (fim is null or fim > inicio)
);

create table conteudos (
  id              uuid primary key default gen_random_uuid(),
  tipo            text not null check (tipo in ('pregacao', 'devocional', 'artigo')),
  titulo          text not null,
  autor           text,
  data            date not null,
  referencia      text,
  versiculo_texto text,
  versiculo_ref   text,
  corpo           text,
  oracao          text,
  video_url       text,
  duracao_min     integer check (duracao_min > 0),
  publicado       boolean not null default true
);
create index conteudos_tipo_data_idx on conteudos (tipo, data desc);

create table devocionais_lidos (
  usuario_id   uuid not null references usuarios (id) on delete cascade,
  conteudo_id  uuid not null references conteudos (id) on delete cascade,
  lido_em      timestamptz not null default now(),
  primary key (usuario_id, conteudo_id)
);

create table favoritos (
  usuario_id   uuid not null references usuarios (id) on delete cascade,
  conteudo_id  uuid not null references conteudos (id) on delete cascade,
  criado_em    timestamptz not null default now(),
  primary key (usuario_id, conteudo_id)
);

create table lembretes (
  usuario_id  uuid not null references usuarios (id) on delete cascade,
  evento_id   uuid not null references eventos (id) on delete cascade,
  criado_em   timestamptz not null default now(),
  primary key (usuario_id, evento_id)
);
