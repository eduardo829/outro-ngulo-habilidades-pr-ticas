# Outro Ângulo 2.0: proposta (Fase 0)

Nada será alterado até você aprovar. Esta é a primeira entrega pedida no documento.

## 1. Diagnóstico da plataforma atual

Já existe e funciona (dados reais: ~30 contas, 10 compras pagas, 10 matrículas):
- **Cursos e Academia**: 8 cursos definidos como dados, aulas com vídeo, progresso, exercícios, matrícula por curso, catálogo com aba Corretores.
- **Pagamentos**: Stripe (cartão/Pix/boleto), compra sem conta, convite por e-mail, aviso de venda para o suporte. **Não será tocado.**
- **Comunidade**: um único feed (publicações, comentários, reações, "ofereço ajuda", destaque, remoção pelo admin).
- **Pessoas**: diretório de membros com perfil opcional (cidade, área, competências, interesses, link, escolha de aparecer ou não).
- **Encontros**: eventos com gestor, link externo, inscrição, perguntas votadas, gravação e resumo.
- **Meu Ângulo e Missões**: plano pessoal, evidências, missões guiadas.
- **Mensagens privadas** entre membros (o documento pede não criar chat agora; proponho manter o que já existe, sem ampliar).
- **Ferramentas públicas** (calculadoras) e página pública de Oportunidades (só apresentação).
- **Admin**: alunos, cursos, vídeos, preços, relatórios por e-mail, limites de IA, papéis.
- **Assistente** e "Me dê outro ângulo" com limites de uso.

Lacunas em relação ao 2.0:
- Comunidade é um feed único: sem várias comunidades, categorias, fixados, moderadores por comunidade nem denúncias.
- Oportunidades não é um mural real (sem publicação, filtros, status ou "tenho interesse").
- Eventos não estão ligados a comunidades e não têm visão de calendário.
- Biblioteca de recursos (templates, prompts, checklists) não existe.
- Início ainda gira em torno de cursos.
- Admin não tem fila de denúncias nem métricas de engajamento (ativos 7/30 dias).

## 2. Nova navegação

```text
Desktop: menu lateral fixo           Celular: barra inferior (5 itens)
 Início                               Início | Comunidades | Oportunidades
 Comunidades                                 | Academia | Mais
   Empreender do Zero                  "Mais" = Eventos, Recursos,
 Oportunidades                          Pessoas, Meu Ângulo, Perfil, Site
 Academia (cursos, trilhas, missões)
 Eventos
 Recursos
 Pessoas
 ----
 Meu Ângulo | Mensagens | Perfil | Site
 Administração (só admins)
```

Endereços antigos continuam funcionando (ex.: /comunidade, /meus-cursos, /encontros redirecionam para o novo lugar).

## 3. Proposta visual (wireframes)

Mantém a identidade atual: papel claro, azul-tinta, verde-limão só como assinatura, Manrope/Inter, linhas finas, poucos cartões.

**Início**
```text
Bom dia, Ana. O que você quer avançar hoje?
[Publicar]  [Explorar comunidades]
------------------------------------------------
Continue de onde parou      | Próximo evento
 Curso X  ███░░ 60%  >      |  Qui 19h · Tema · [Confirmar]
------------------------------------------------
Discussões em Empreender do Zero (3 mais recentes)
------------------------------------------------
Oportunidades recentes (3)  | Recomendado para você (1-2)
```
Bloco sem dados não aparece. Nada de número decorativo.

**Comunidade**
```text
[capa]  Empreender do Zero · pública
Descrição curta            [Participar]
Abas: Feed | Membros | Eventos | Cursos
Categorias: Todas · Ideias · Dúvidas · Vitórias · Ferramentas
 ▸ Fixado: Comece por aqui
 [Escreva algo para a comunidade...]
 Publicação · autor · categoria · reações · comentários · ⋯ denunciar
 [Carregar mais]
```

**Oportunidades**
```text
Oportunidades            [Publicar oportunidade]
Filtros: categoria ▾  local ▾ (cidade / remoto)  ☐ só abertas
 Procurando sócio · Remoto · aberta
 Título
 Duas linhas de descrição...
 Autor · há 2 dias            [Tenho interesse]
```
"Tenho interesse" avisa o autor e mostra a ele quem se interessou; o contato segue pelas mensagens já existentes. Sem pagamentos nem contratos.

## 4. O que é reaproveitado

- Login, contas, perfis, papéis e regras de segurança atuais.
- Publicações, comentários, reações e destaque viram a base do feed das comunidades (as publicações atuais vão para Empreender do Zero, sem perda).
- Encontros viram o módulo Eventos (ganha comunidade e calendário).
- Diretório de Pessoas e perfil: só ganham campos novos e controle de visibilidade.
- Notificações e mensagens atuais para avisos de interesse e respostas.
- Cursos, aulas, matrículas, pagamentos: intocados; só muda a apresentação.

## 5. Dados necessários (tudo novo, nada apagado)

- **Comunidades**: nome, descrição, capa, tipo (pública / privada / exclusiva), ativa ou não. As quatro são criadas; só Empreender do Zero ativa.
- **Membros da comunidade**: quem participa e com qual papel (membro, moderador, admin).
- **Categorias** por comunidade.
- **Publicações**: ganham comunidade, categoria e "fixado".
- **Denúncias**: de publicação, comentário ou oportunidade, com status para o admin.
- **Oportunidades**: título, descrição, categoria, cidade ou remoto, autor, status aberta/encerrada.
- **Interesses em oportunidades**: quem demonstrou interesse.
- **Eventos**: ganham comunidade relacionada.
- **Recursos**: título, tipo, descrição, link/arquivo, comunidade ou curso relacionado, publicado ou não.
- **Perfil**: ganha objetivos, aberto a parcerias, visibilidade (todos os membros / só comunidades / oculto). Padrão para contas antigas: oculto até a pessoa escolher, para não expor nada automaticamente.
- **Atividade**: registro simples de "última atividade" para medir ativos em 7/30 dias.

Todas as tabelas novas com regras de acesso no servidor: conteúdo privado só para membros autorizados; ações de moderação só para moderadores/admins; limite de publicações por minuto contra spam.

## 6. Riscos e como evitamos

| Risco | Cuidado |
|---|---|
| Aluno perder acesso | Matrículas, aulas e progresso não são alterados; teste com uma conta real de aluno antes de publicar |
| Pagamento quebrar | Nenhuma mudança em checkout/Stripe; teste de compra até a tela do Stripe |
| Links da campanha quebrarem | /corretor-na-pratica e /cursos ficam iguais |
| Exposição de dados | Visibilidade de perfil começa oculta; testes automáticos das regras de acesso |
| Comunidade vazia no lançamento | Sem publicações fictícias; sugiro que os gestores façam 3-5 publicações reais no 1º dia |
| Spam | Limite de frequência, denúncia e remoção rápida |

## 7. Complexidade por fase

- **Fase 1 (MVP)**: alta. Navegação, Início, perfis, uma comunidade com moderação, oportunidades, eventos ligados, admin básico e métricas. Feito em 4 entregas, cada uma testada e só publicada com seu aval.
- **Fase 2**: média. Ativar outras comunidades (já prontas), desafios de 7/30 dias, biblioteca de recursos, recomendações simples.
- **Fase 3**: só planejamento, nada construído.

## 8. Plano de execução (Fase 1)

1. **Base**: estrutura de dados nova, migração das publicações atuais para Empreender do Zero, perfil ampliado com visibilidade.
2. **Navegação + Início**: menu lateral/barra inferior, novo painel, redirecionamentos dos endereços antigos, onboarding curto opcional (contas antigas não são bloqueadas).
3. **Comunidade + Oportunidades**: página da comunidade, categorias, fixados, denúncias; mural de oportunidades com filtros e "tenho interesse".
4. **Eventos + Admin**: eventos por comunidade com calendário; admin de comunidades, denúncias, oportunidades, eventos e métricas reais (cadastros, ativos 7/30 dias, publicações, comentários, inscrições em eventos).

Ao fim de cada etapa: testes automáticos, verificação no celular e computador, e checagem de que um aluno real continua acessando o curso.

## Detalhes técnicos

- Novas tabelas em `public` com GRANT + RLS: `communities`, `community_members`, `community_categories`, `reports`, `opportunities`, `opportunity_interests`, `resources`; colunas novas aditivas em `posts` (`community_id`, `category_id`, `pinned`), `events` (`community_id`), `profiles` (`goals`, `open_to_partnerships`, `visibility`, `last_active_at`).
- Helpers security definer `is_community_member`, `is_community_mod`; `profile_visible` estendido para a nova visibilidade.
- Paginação por cursor (`created_at,id`) nos feeds e listas.
- Novas rotas: `/_authenticated/comunidades`, `/comunidades/$slug`, `/oportunidades` (membros), `/eventos`, `/recursos`, `/admin/comunidades|denuncias|oportunidades|metricas`; rotas antigas viram redirects.
- Nenhum arquivo de checkout, Stripe, enrollments ou `checkout_*` é editado.
