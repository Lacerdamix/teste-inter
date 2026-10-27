# App IBaj (Igreja Batista do Jaraguá)

App mobile simples para a IBaj (ibaj.com.br), igreja batista reformada em Belo Horizonte.
Lema da igreja: "Simples, Confessional, Reformada". O visual segue essa linha: sóbrio, limpo, sem excessos.

## O que tem neste pacote

- `telas-html/`: as 6 telas em HTML estático (390x844), com fontes e logo locais. Abra no navegador como referência visual exata.
- `telas-png/`: as mesmas telas em PNG 3x, mais uma visão geral com todas lado a lado.
- `assets/`: logo original (fundo creme) e logo recortada com fundo transparente.

Os HTMLs são referência de design, não código de produção. Reimplemente na stack escolhida mantendo os tokens abaixo.

## Escopo (MVP)

1. Início: saudação, próximo culto em destaque, devocional do dia, últimos avisos, programação da semana.
2. Avisos: lista com filtros (Todos, Igreja, Ministérios, Eventos), aviso fixado com imagem e CTA.
3. Agenda: seletor de dias da semana, eventos agrupados por dia, ações "Lembrar-me" e "Adicionar ao calendário".
4. Conteúdos: busca, filtros (Tudo, Pregações, Devocionais, Artigos), última pregação em vídeo, devocionais, pregações anteriores.
5. Devocional: leitura com data, título, versículo em destaque, texto, seção "Para orar", marcar como lido, favoritar, compartilhar, ajuste de fonte.
6. Membros: busca, aniversariantes da semana, filtros (Todos, Liderança, Ministérios), lista com avatar, nome, ministério e botão de mensagem.

Navegação inferior com 5 abas: Início, Avisos, Agenda, Conteúdos, Membros. Devocional abre a partir do Início e de Conteúdos.

## Design tokens

Cores (extraídas da logo):
- Verde principal: `#195829` (botões, destaques, aba ativa, card do próximo culto)
- Verde sálvia: `#93B793` (cor clara da logo)
- Sálvia suave: `#E4EDE2` (fundo de ícones, versículo, avatares)
- Fundo do app: `#F6F5F0` (creme da logo)
- Superfície (cards): `#FFFFFF`
- Texto: `#111827`
- Texto secundário: `#4B5563` (corpo de apoio `#374151`)
- Borda: `#E5E7EB` (inputs e chips `#D1D5DB`)
- Alerta (badge de notificação): `#DC2626`

Tipografia:
- Interface: Manrope (400 a 800). Títulos de tela 30px/800, títulos de seção 19px/800, títulos de card 15 a 16px/700, apoio 13px.
- Leitura do devocional: Source Serif 4, 18px, entrelinha 1.65. Versículo em 21px.

Forma:
- Cards: raio 20 a 24px, borda 1px, sem sombra.
- Botões e chips: formato pílula, altura mínima 44px.
- Alvos de toque: mínimo 44x44px.
- Ícones de traço, 22px, stroke 1.9.

Regras visuais: nada de rodapé genérico com nome do projeto, nada de etiquetas em maiúsculas espaçadas acima de títulos, sem travessões nos textos.

## Conteúdo real (do site)

- Culto Dominical: domingo, 10h30, com café antes do culto
- Escola Bíblica Dominical: domingo, 9h
- Jovens: sábado, 19h30
- Homens: quinta, 20h (quinzenal)
- Mulheres: quarta, 19h30 (quinzenal)
- No Caminho: quinta, 20h (quinzenal)
- Ministérios: Homens, Mulheres, Jovens, Ação Social
- Governo: assembleia, que elege um Conselho Ministerial
- O site já tem uma seção de Artigos e Devocionais

Nomes de membros, avisos de exemplo e textos entre colchetes ([Nome do pastor], [Arte do aviso], [Total]) são placeholders.

## Modelo de dados sugerido

- Aviso: título, texto, categoria, imagem opcional, CTA opcional (texto + link), fixado, data de publicação, expira em
- Evento: título, descrição, local, início, fim, recorrência (semanal ou quinzenal), destaque
- Conteúdo: tipo (pregação, devocional, artigo), título, autor, data, referência bíblica, corpo, vídeo, duração
- Membro: nome, foto, aniversário (dia e mês), ministérios, cargo, contato, visível no hall (sim/não)
- Usuário: vínculo com membro, devocionais lidos, favoritos

Precisa de um painel simples para a secretaria publicar avisos, eventos e devocionais.

## Pontos em aberto

- Hall de membros envolve dados pessoais (LGPD): visível só para membros logados? Cada pessoa pode optar por não aparecer? Mostrar só dia e mês do aniversário.
- Datas exatas dos encontros quinzenais.
- Stack, autenticação e onde hospedar.
- "Assistir online": confirmar canal (YouTube da IBaj).
