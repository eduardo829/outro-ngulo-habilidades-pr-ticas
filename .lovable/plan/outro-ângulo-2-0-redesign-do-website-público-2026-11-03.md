# Outro Ângulo 2.0 — Redesign do website público

## Auditoria do estado atual

**Páginas públicas hoje:** `/` (home), `/trilhas`, `/ferramentas`, `/cursos`, `/cursos/$slug`, `/conheca-a-comunidade`, `/conheca-os-encontros`, `/oportunidades`, `/gestores`, `/gestor/$slug`, `/sobre`, `/corretor-na-pratica` (campanha), `/diretrizes`, `/privacidade`, `/termos`, `/auth`, páginas de pagamento.

**Área de membros:** `/inicio`, `/comunidades`, `/mural` (oportunidades), `/meus-cursos`, `/especialistas`, `/encontros`, `/recursos`, `/pessoas`, `/meu-angulo`, etc. — todas privadas, não indexadas.

**O que já funciona e será preservado:** checkout Stripe e página de campanha do Corretor, pixel Meta com consentimento, analytics, e-mails, autenticação única (site e plataforma no mesmo domínio), botão "Voltar ao site" na área de membros, "Minha área" no site público.

**Problema atual:** a home vende só cursos ("habilidades que a escola não ensina"). Nada nela mostra comunidades, especialistas ou oportunidades — o ecossistema existe, mas é invisível para o visitante.

## Novo posicionamento

- Proposta de valor: **"Aprenda. Conecte-se. Construa."**
- Headline: "Um novo ângulo para transformar suas ideias em realidade."
- "Coisas que a escola não ensina" vira assinatura editorial (rodapé/momentos editoriais), não mais a headline.
- Sem promessas financeiras, sem se posicionar como aceleradora ou intermediadora de investimento.

## Novo sitemap público

```
/                    Home (redesenhada)
/como-funciona       Jornada em 5 passos (nova)
/comunidades         Página pública das comunidades (nova; /conheca-a-comunidade → redireciona)
/especialistas       Página pública do diretório (nova)
/oportunidades       Já existe — inclui Startups e parcerias
/academia            Vitrine de cursos (nova; /cursos continua funcionando)
/cursos, /cursos/$slug, /corretor-na-pratica   Inalterados (checkout preservado)
/gestores, /sobre, /conheca-os-encontros, /trilhas, /ferramentas   Inalterados
```

**Colisão de URLs:** `/comunidades` e `/especialistas` hoje são rotas de membros. Proposta: as rotas de membros dessas duas seções passam para `/app/comunidades` e `/app/especialistas`, com redirecionamento automático para quem estiver logado. As URLs públicas ficam limpas e indexáveis; as de membros ficam claramente privadas (não indexadas). Nenhuma outra rota de membros muda.

**Menu público novo:** Início · Comunidades · Especialistas · Oportunidades · Academia · Sobre · [Entrar / Minha área]. Logo leva à home pública.

## Wireframe da nova homepage

```text
┌────────────────────────────────────────────────────┐
│ HERO                                               │
│ "Um novo ângulo para transformar suas ideias       │
│  em realidade."                                    │
│ Aprenda com quem faz, encontre especialistas,      │
│ conecte-se com empreendedores...                   │
│ [Explorar a plataforma]  [Como funciona]           │
│ Assinatura: "Coisas que a escola não ensina."      │
├────────────────────────────────────────────────────┤
│ UM ECOSSISTEMA DE POSSIBILIDADES (4 cards)         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│ │Comunida- │ │Especial- │ │Startups &│ │Academia │ │
│ │des       │ │istas     │ │Oportunid.│ │         │ │
│ └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
├────────────────────────────────────────────────────┤
│ COMO FUNCIONA (jornada numerada 01–05)             │
│ Crie seu perfil → Escolha interesses → Participe   │
│ das comunidades → Encontre conhecimento, especial- │
│ istas e oportunidades → Desenvolva projetos        │
├────────────────────────────────────────────────────┤
│ PARA QUEM É (6 públicos em grade)                  │
├────────────────────────────────────────────────────┤
│ COMUNIDADES EM DESTAQUE                            │
│ Empreender do Zero (real, do banco) + "Em breve"   │
├────────────────────────────────────────────────────┤
│ ENCONTRE ESPECIALISTAS                             │
│ [Encontrar um especialista] [Quero oferecer        │
│  meus serviços]                                    │
├────────────────────────────────────────────────────┤
│ STARTUPS E PARCERIAS → /oportunidades              │
│ Sem promessa de investidores ou retorno            │
├────────────────────────────────────────────────────┤
│ ACADEMIA — vitrine com cursos reais e preços       │
│ reais (do banco), sem dominar a página             │
├────────────────────────────────────────────────────┤
│ QUEM ESTÁ POR TRÁS (gestores, como hoje)           │
├────────────────────────────────────────────────────┤
│ CONVITE FINAL (faixa escura)                       │
│ "Seu próximo passo pode começar com uma conexão."  │
│ [Fazer parte do Outro Ângulo]                      │
└────────────────────────────────────────────────────┘
```

Regras de conteúdo: comunidades e cursos vêm do banco (reais); sem números inventados de membros ou resultados; especialistas só aparecem se houver aprovados — caso contrário, a seção explica o serviço e leva à lista de interesse, identificada como tal.

## Impactos

- **SEO:** URLs de cursos, campanha e checkout intactas. Redirecionamentos permanentes: `/conheca-a-comunidade` → `/comunidades`. Novas páginas com título, descrição e og próprios. Área de membros segue fora do sitemap e sem indexação. Sitemap atualizado com as páginas novas.
- **Analytics/pixel:** nenhuma ferramenta nova. Reuso dos eventos existentes (PageView, InitiateCheckout, Purchase) e do analytics já instalado; cadastro e cliques nos CTAs passam pelos mesmos caminhos atuais.
- **Checkout e pagamentos:** intocados.
- **Autenticação:** intocada — mesmo domínio, mesma sessão, "Voltar ao site" mantido.

## Fases de implementação

**Fase 1 — Nova homepage** (sem mudança de rotas): hero com novo posicionamento, 4 pilares, como funciona, para quem é, comunidades em destaque (dados reais), especialistas, startups/parcerias, vitrine da Academia, gestores, convite final. Home antiga sai do ar só quando a nova estiver pronta.

**Fase 2 — Menu e páginas institucionais:** novo menu público; páginas `/como-funciona`, `/comunidades`, `/especialistas`, `/academia`; mudança das rotas de membros `/comunidades*` e `/especialistas*` para `/app/*` com redirecionamentos; sitemap e metadados.

**Fase 3 — Revisão e polimento:** testes desktop/mobile, performance de carregamento, verificação de SEO e dos eventos de conversão, pente fino de acessibilidade.

Cada fase fica pronta na prévia antes de publicar; publicação só com seu pedido explícito.
