# Outro Ângulo 2.0 — Complemento: Especialistas, Sócios, Startups e Oportunidades

Integra o prompt complementar ao plano 2.0 já em andamento (Comunidades, Oportunidades, Recursos, Pessoas, Eventos, Meu Ângulo, Moderação). Nada é descartado; cursos, matrículas e pagamentos não são tocados.

## 1. Visão consolidada

"Conectando pessoas, conhecimento e oportunidades para transformar ideias em negócios."

Um único cadastro, vários papéis públicos (membro, aluno, empreendedor, especialista, fundador, parceiro). Quatro pilares ligados entre si pelas comunidades:

- **Conhecimento** — Academia (cursos atuais), Ferramentas, Recursos.
- **Pessoas** — Comunidades, Pessoas, Especialistas.
- **Oportunidades** — Mural (já existe), Busca de sócio, Startups & Projetos.
- **Encontros** — Eventos.

Investidores ficam só como conteúdo educativo; nada de captação.

## 2. Nova navegação

```text
Início · Comunidades · Oportunidades · Especialistas · Startups & Projetos · Academia · Eventos · Ferramentas
                         └ Mural | Busca de sócio
Celular (barra inferior): Início · Comunidades · Oportunidades · Academia · Mais (resto)
Meu Ângulo, Pessoas, Recursos, Mensagens → menu do perfil
```

Módulo sem conteúdo real não aparece no menu (ex.: Especialistas só entra quando houver pelo menos 1 perfil aprovado; até lá, apenas "Quero ser especialista" no perfil).

## 3. Wireframes principais

```text
ESPECIALISTAS (/especialistas)
[Busca] [Categoria v] [Remoto/Cidade] [Só verificados □]
┌ Foto  Nome  ✓ Verificado pelo Outro Ângulo (se houver)
│ Especialidades · Cidade/Remoto · Disponibilidade
│ Faixa de orçamento (se informada)      [Ver perfil]
└──────────
[Descrever minha necessidade] → formulário de solicitação

PERFIL DO ESPECIALISTA (/especialistas/$id)
Cabeçalho: foto, nome, selo (estado), categorias
Sobre · Experiência · Portfólio (links) · Credenciais (ex.: OAB/CRC, informadas e, se verificadas, marcadas)
Atendimento: remoto/cidade, disponibilidade, faixa
[Solicitar proposta]  [Mensagem]   (sem avaliações nem depoimentos)

SOLICITAR SERVIÇO (modal)
Necessidade · Categoria · Orçamento aprox. · Prazo · Cidade/remoto
→ vai para fila do admin, que encaminha a 1–3 especialistas compatíveis

BUSCA DE SÓCIO (/oportunidades/socios)
[Setor v] [Estágio v] [Competência procurada] [Remoto]
Cartão: ideia (resumo público) · setor · estágio · competências buscadas · tipo de parceria
[Tenho interesse] → dono aceita/recusa → só então abre conversa

STARTUPS & PROJETOS (/startups)
Filtros: setor · estágio (ideia/validação/MVP/operação/expansão) · tipo de colaboração
Cartão: nome · setor · estágio · necessidades · equipe · link
Página do projeto: descrição, equipe (só membros que aceitaram aparecer), necessidades, [Quero colaborar]

ADMIN → Ecossistema
Abas: Especialistas (pendentes/aprovar/verificar/suspender) · Solicitações (encaminhar) · Sócios & Projetos (moderação) · Registro de ações
```

## 4. O que é reaproveitado

- `profiles`, `user_roles`, `has_role`/`is_staff` — identidade única; papéis administrativos continuam só em `user_roles`.
- `opportunities` + `opportunity_interests` + gatilho de notificação — base para o Mural; Busca de sócio vira uma categoria com campos extras.
- `reports`, `/admin/moderacao`, limites anti-spam (`opportunities_rate`), `notifications`, `conversations`/`start_conversation`.
- `communities` — cada especialista, projeto ou oportunidade pode ser ligado a uma comunidade e aparecer nela.
- `experts` atual é dos gestores dos eventos/cursos; **não** será misturado com o diretório novo.

## 5. Esquema de dados proposto (somente adições)

- `professional_profiles` — user_id (único), headline, about, experience, categories[], specialties[], city, remote, availability, budget_min/max (opcional), portfolio jsonb (links), credentials jsonb (tipo, número, órgão), `status` (draft/pending/approved/suspended), `verified_at`, `verified_by`, community_ids[]. Público só quando approved; dono vê/edita o seu; status e verificação só mudam por staff (gatilho de proteção).
- `service_requests` — requester_id, category, need, budget_text, deadline, city/remote, status (new/forwarded/closed). Dono e staff leem.
- `service_request_matches` — request_id, professional_id, sent_by, status (sent/accepted/declined). O especialista vê só as que recebeu.
- `opportunities` ganha colunas opcionais: sector, stage, skills_wanted[], partnership_type, community_id. Interesse em sócio ganha `status` (pending/accepted/declined) em `opportunity_interests`.
- `projects` — owner_id, name, sector, description, stage, collab_types[], needs, city, remote, link_url, status (draft/published/removed), community_id.
- `project_members` — project_id, user_id, role_label, accepted (só aparece quem aceitou).
- `needs_profile` (matchmaking MVP) — user_id, offers[], seeks[], sectors[]; só usado para sugestões simples por coincidência de categoria.
- `admin_actions` — actor_id, action, target_kind, target_id, note, created_at (registro de aprovações, verificações, remoções).
- Visibilidade: `consent_public` em cada perfil/projeto; nada é exposto sem o dono marcar.

Todas com RLS, GRANTs e testes PGlite seguindo o padrão do projeto.

## 6. Riscos

- **Regulatório:** investimento/participação societária pode configurar oferta pública (CVM 88) — por isso nenhuma captação, sem valuation, sem comissões. Profissões regulamentadas (OAB, CRC, CRM): o selo diz só "credencial conferida em DD/MM", nunca garantia; advogados não podem ter anúncio mercantil (Provimento 205/2021 da OAB) — perfil sóbrio, sem preço para jurídico.
- **LGPD:** dados de contato e de projeto só com consentimento; "Excluir minha conta" passa a ser necessário (já listado).
- **Operacional:** verificação e encaminhamento manual exigem tempo da equipe; diretório vazio no início — por isso o módulo só aparece com perfis aprovados reais.
- **Confiança:** golpes em oportunidades/sociedades — denúncia, aviso de segurança, limite de publicações, moderação prévia para projetos.
- **Técnico:** baixo — reaproveita padrões já existentes.

## 7. Fases

**MVP (agora)**
- Navegação nova com Especialistas/Startups ocultos até haver conteúdo.
- Perfil profissional + "Quero ser especialista" + aprovação/verificação no admin.
- Diretório de especialistas + solicitação de serviço + encaminhamento manual.
- Busca de sócio dentro de Oportunidades (campos novos + aceitar/recusar interesse).
- Registro de ações administrativas.

**Segunda fase**
- Startups & Projetos com equipe e moderação.
- Formulário de necessidades e sugestões simples ("pessoas que oferecem o que você procura").
- Especialistas/projetos aparecendo dentro das comunidades.
- Área educativa sobre investimento (somente conteúdo).

**Futuro (só com revisão jurídica)**
- Diretório de investidores, matchmaking inteligente, planos premium, pagamento por serviços, avaliações verificadas.

## 8. Complexidade estimada

| Item | Esforço |
|---|---|
| Navegação | Baixo |
| Perfil profissional + admin de verificação | Médio |
| Diretório + solicitação + encaminhamento | Médio |
| Busca de sócio | Baixo–médio |
| Registro de ações | Baixo |
| Startups & Projetos (fase 2) | Médio |
| Sugestões por necessidades (fase 2) | Baixo–médio |

## Decisões que preciso de você

1. Aprovar o MVP acima (ou mover Startups para o MVP).
2. Quem verifica especialistas na equipe (para o painel e o texto do selo).
3. Se faixa de orçamento pode aparecer publicamente para todas as categorias exceto jurídico.

Nada será implementado antes da sua aprovação; nenhuma mudança destrutiva, nem em pagamentos.
