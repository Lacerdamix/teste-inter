# App IBaj

PWA da Igreja Batista do Jaraguá: início, avisos, agenda, conteúdos (pregações, devocionais e artigos), leitura do devocional e hall de membros, mais um painel para a secretaria publicar tudo.

O design segue as telas de referência em [`docs/telas`](docs/telas) e o briefing em [`docs/briefing.md`](docs/briefing.md).

## Stack

| Camada | Tecnologia |
| --- | --- |
| Front | React 19, Vite 8, React Router 7, `vite-plugin-pwa` (service worker com Workbox) |
| API | Node 22, Express 5, Zod, JWT |
| Banco | PostgreSQL 16 (driver `pg`, migrações em SQL puro) |

Monorepo com npm workspaces: `web/` (PWA) e `api/` (API REST). Em produção a API também serve o build do PWA, então é um único processo para hospedar.

## Rodando localmente

Pré-requisitos: Node 22+ e Docker (ou um Postgres 16 local).

```bash
cd ibaj-app
cp .env.example .env
npm install
npm run db:up        # sobe o Postgres no Docker
npm run db:seed      # cria as tabelas e dados de exemplo
npm run dev          # API em :3001 e PWA em http://localhost:5173
```

Contas criadas pelo seed:

- Secretaria: `secretaria@ibaj.com.br` / `ibaj-secretaria` (ou o que estiver em `ADMIN_EMAIL` e `ADMIN_PASSWORD`)
- Membro: `mariana@exemplo.com` / `ibaj1234`

Para recriar os dados do zero: `npm run db:seed -- --reset`.

Outros comandos:

```bash
npm run typecheck    # TypeScript da API e do front
npm test             # testes da API (datas, aniversários, arquivo .ics)
npm run build        # build de produção
npm start            # sobe a API servindo o PWA compilado em :3001
```

## Telas e funcionalidades

- **Início**: saudação, próximo culto (evento marcado como destaque), devocional do dia, últimos avisos e os próximos encontros da semana. O sino mostra um ponto quando há aviso novo desde a última visita.
- **Avisos**: filtros por categoria, aviso fixado com imagem e botão de ação opcionais. Avisos saem do ar sozinhos na data de expiração.
- **Agenda**: semana a partir de hoje, navegação entre semanas, eventos semanais e quinzenais expandidos pela API. "Lembrar-me" salva um lembrete na conta; "Adicionar ao calendário" baixa um `.ics` com a regra de repetição.
- **Conteúdos**: busca, filtros, última pregação em vídeo, devocionais, pregações anteriores e artigos. Conteúdo com data futura só aparece a partir do dia.
- **Devocional**: versículo em destaque, texto em Source Serif 4, "Para orar", ajuste de fonte (fica salvo), compartilhar, marcar como lido e favoritar.
- **Membros**: busca sem acento, aniversariantes da semana, filtros por liderança e ministérios, botão de mensagem (WhatsApp ou e-mail).
- **Minha conta** (toque na saudação do Início): favoritos, opção de aparecer ou não no hall, sair, acesso ao painel.
- **Painel da secretaria** (`/admin`): cadastro de avisos, eventos, conteúdos e membros, e aprovação de contas.

### Privacidade (LGPD)

- O hall de membros só é entregue pela API para contas **aprovadas** pela secretaria. Quem se cadastra pelo app fica pendente até a aprovação.
- Cada membro pode sair do hall em "Minha conta" (e a secretaria também pode ocultar).
- Do aniversário guardamos só dia e mês.
- Ao sair da conta, o cache offline da API é apagado do aparelho.

### Offline

O service worker guarda o app e as fontes, e as respostas da API ficam em cache com estratégia network-first: sem internet, o app mostra a última versão vista de avisos, agenda e devocionais. Painel e login nunca passam pelo cache.

## Estrutura

```
ibaj-app/
  api/
    db/migrations/    SQL versionado, aplicado em ordem
    src/
      routes/         publico, conta (login, perfil, marcações), membros, admin
      lib/            agenda (recorrência), aniversários, datas no fuso de BH, .ics
      seed.ts         dados de exemplo
    test/
  web/
    public/           fontes (woff2), logo, ícones do PWA
    src/
      pages/          uma tela por arquivo; admin/ é o painel
      components/     navegação, ícones, chips, busca, estados
  docs/               briefing e telas de referência
```

## Banco de dados

Tabelas: `membros`, `usuarios`, `avisos`, `eventos`, `conteudos`, `devocionais_lidos`, `favoritos`, `lembretes`. O esquema completo está em [`api/db/migrations/001_inicial.sql`](api/db/migrations/001_inicial.sql).

Eventos guardam só a primeira ocorrência e a recorrência (`nenhuma`, `semanal`, `quinzenal`); a API gera as datas da agenda com `generate_series`. Todos os horários são `timestamptz` e exibidos no fuso `America/Sao_Paulo`, independente do fuso do aparelho.

Para mudar o esquema, crie um novo arquivo `api/db/migrations/002_*.sql`; `npm run db:migrate` aplica só o que ainda não rodou.

## Deploy

O `Dockerfile` gera uma imagem única que aplica as migrações e sobe a API servindo o PWA na porta 3001. Variáveis necessárias em produção: `DATABASE_URL`, `JWT_SECRET` e `NODE_ENV=production`. O PWA precisa de HTTPS para instalar e registrar o service worker.

## Pontos em aberto

- **Notificações**: "Lembrar-me" já salva o lembrete, mas o envio (Web Push com chaves VAPID e um job que dispara antes do evento) ainda não foi feito.
- **Datas dos encontros quinzenais**: o seed usa datas de exemplo; a secretaria ajusta a primeira data de cada um no painel.
- **Canal do YouTube e endereço**: configure `VITE_YOUTUBE_URL` e `VITE_MAPS_URL` no `.env` antes do build.
- **Placeholders**: nomes de membros, `[Nome do pastor]` e textos entre colchetes vêm do briefing e devem ser trocados pelo conteúdo real.
- **Imagens**: avisos e membros aceitam link de imagem; upload direto pelo painel ainda não existe.
- **Segurança**: falta limitar tentativas de login e um fluxo de "esqueci minha senha".
- **Hospedagem**: a definir. Qualquer serviço que rode um container Node com um Postgres gerenciado serve (Railway, Render, Fly.io).
