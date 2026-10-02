import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MEMBERS = [
  { name: "Juliana Ferreira", city: "Belo Horizonte", persona: "Empreendedor", working_on: "Tocando uma confeitaria por encomenda e querendo abrir a primeira loja.", interests: ["Empreendedorismo", "Finanças", "Vendas"], skills: ["Atendimento", "Instagram", "Precificação de doces"], learn: ["Gestão financeira", "Negociação"] },
  { name: "Rafael Souza", city: "São Paulo", persona: "Profissional", working_on: "Analista de dados em um banco, pensando em migrar para produto.", interests: ["Carreira", "Tecnologia & IA", "Comunicação"], skills: ["SQL", "Excel", "Power BI"], learn: ["Falar em público", "Networking"] },
  { name: "Camila Nunes", city: "Recife", persona: "Estudante", working_on: "Último ano de administração, procurando o primeiro estágio.", interests: ["Carreira", "Networking", "Planejamento"], skills: ["Organização", "Canva"], learn: ["Entrevistas", "LinkedIn", "Networking"] },
  { name: "Lucas Oliveira", city: "Curitiba", persona: "Freelancer", working_on: "Editor de vídeo para criadores; quero sair da dependência de poucos clientes.", interests: ["Vendas", "Negociação", "Empreendedorismo"], skills: ["Edição de vídeo", "Premiere", "Roteiro"], learn: ["Prospecção", "Precificação"] },
  { name: "Patrícia Lima", city: "Porto Alegre", persona: "Profissional", working_on: "Coordenadora de RH em uma indústria, 11 anos de área.", interests: ["Liderança", "Comunicação", "Carreira"], skills: ["Recrutamento", "Currículo", "Entrevistas"], learn: ["Tecnologia & IA", "Finanças pessoais"] },
  { name: "Diego Martins", city: "Goiânia", persona: "Empreendedor", working_on: "Construindo uma agência de tráfego pago com mais dois sócios.", interests: ["Vendas", "Liderança", "Tecnologia & IA"], skills: ["Meta Ads", "Google Ads", "Funil de vendas"], learn: ["Gestão de equipe", "Contratos"] },
  { name: "Ana Beatriz Costa", city: "Salvador", persona: "Criador", working_on: "Produzo conteúdo sobre finanças para jovens no TikTok.", interests: ["Comunicação", "Finanças", "Empreendedorismo"], skills: ["Roteiro", "Finanças pessoais", "Gravação com celular"], learn: ["Negociar com marcas", "Planejamento"] },
  { name: "Marcos Ribeiro", city: "Campinas", persona: "Profissional", working_on: "Mestre de obras há 15 anos, estudando para abrir minha construtora.", interests: ["Empreendedorismo", "Negociação", "Planejamento"], skills: ["Construção", "Orçamento de obra", "Gestão de equipe"], learn: ["Marketing", "Tecnologia & IA"] },
];

type P = { a: number; kind: string; category: string; body: string; opp?: string };
const POSTS: P[] = [
  { a: 1, kind: "pergunta", category: "Carreira", body: "Quem já fez transição de dados para produto? Vale mais fazer curso ou pedir para participar de projetos internos?" },
  { a: 4, kind: "experiencia", category: "Comunicação", body: "Aprendi do jeito difícil: feedback ruim dado em grupo destrói a confiança do time. Hoje faço sempre em particular e com exemplo concreto." },
  { a: 0, kind: "aprendizado", category: "Dinheiro", body: "Separar a conta da confeitaria da minha conta pessoal mudou tudo. Pela primeira vez sei quanto realmente sobra no fim do mês." },
  { a: 2, kind: "pergunta", category: "Networking", body: "Como puxar conversa com alguém da área no LinkedIn sem parecer que estou só pedindo emprego?" },
  { a: 7, kind: "discussao", category: "Empreendedorismo", body: "Para quem já abriu empresa: abrir como MEI e migrar depois, ou já começar como ME? Quero entender os prós e contras na prática." },
  { a: 5, kind: "experiencia", category: "Negociação", body: "Perdemos um cliente grande por não ter contrato com escopo bem definido. Agora todo projeto começa com uma página explicando o que está e o que não está incluso." },
  { a: 6, kind: "discussao", category: "Comunicação", body: "Gravar todo dia ou gravar em lote no fim de semana? Testei os dois e o lote ganhou de longe na constância." },
  { a: 3, kind: "aprendizado", category: "Geral", body: "Dica simples que funcionou: mandar uma mensagem de acompanhamento 3 dias depois de enviar o orçamento. Fechei 2 de 5 que estavam parados." },
  { a: 1, kind: "discussao", category: "Tecnologia & IA", body: "Qual uso de IA realmente economizou tempo no trabalho de vocês? Para mim foi resumir reuniões longas." },
  { a: 4, kind: "pergunta", category: "Carreira", body: "Para quem contrata: o que faz um currículo de primeiro emprego chamar sua atenção?" },
  { a: 3, kind: "ajuda", category: "Empreendedorismo", body: "Estou tentando conseguir meus primeiros clientes fora do círculo de amigos. Alguém aqui já passou por isso?" },
  { a: 2, kind: "ajuda", category: "Carreira", body: "Tenho entrevista na semana que vem para estágio em RH e travo nas perguntas comportamentais. Alguém topa simular comigo?" },
  { a: 0, kind: "ajuda", category: "Dinheiro", body: "Não sei como calcular o preço dos meus bolos incluindo gás, embalagem e meu tempo. Alguém pode me ajudar a montar uma planilha?" },
  { a: 7, kind: "ajuda", category: "Tecnologia & IA", body: "Quero usar IA para fazer orçamentos de obra mais rápido. Alguém que entende disso pode me dar um caminho?" },
  { a: 6, kind: "ajuda", category: "Negociação", body: "Uma marca me procurou para publi e não faço ideia de quanto cobrar. Alguém já negociou isso?" },
  { a: 5, kind: "oportunidade", category: "Oportunidades", opp: "Procuro freelancer", body: "Estou procurando alguém que entenda de automação com IA para um projeto de atendimento no WhatsApp." },
  { a: 7, kind: "oportunidade", category: "Oportunidades", opp: "Procuro sócio", body: "Procuro sócio com experiência comercial para abrir uma construtora focada em reformas residenciais em Campinas." },
  { a: 4, kind: "oportunidade", category: "Oportunidades", opp: "Tenho uma oportunidade", body: "Temos duas vagas de estágio em RH abertas aqui na empresa, em Porto Alegre. Me chama que explico o processo." },
  { a: 3, kind: "oportunidade", category: "Oportunidades", opp: "Procuro parceiro", body: "Procuro designer para fazermos pacotes juntos (vídeo + identidade visual) para pequenos negócios." },
];

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

/** Creates demo members (flagged is_demo) with posts, replies and bookings. Admin only. */
export const seedDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { count } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("is_demo", true);
    if ((count ?? 0) > 0) return { created: 0 };
    const ids: string[] = [];
    const at = (i: number) => ids[i % ids.length]!;
    for (const [i, m] of MEMBERS.entries()) {
      const { data, error } = await db.auth.admin.createUser({
        email: `demo${i + 1}@demo.outroangulo.invalid`, password: crypto.randomUUID() + "Aa1!", email_confirm: true,
        user_metadata: { display_name: m.name },
      });
      if (error || !data.user) throw new Error("Falha ao criar membro de demonstração");
      ids.push(data.user.id);
      await db.from("profiles").update({
        display_name: m.name, city: m.city, persona: m.persona, area: m.persona, working_on: m.working_on, interests: m.interests,
        skills: m.skills, learn_tags: m.learn, can_share: m.skills.join(", "), wants_learn: m.learn.join(", "),
        in_directory: true, onboarded: true, is_demo: true,
      }).eq("id", data.user.id);
    }
    const now = Date.now();
    const { data: posts } = await db.from("posts").insert(POSTS.map((p, i) => ({
      author_id: at(p.a), kind: p.kind, category: p.category, opportunity_type: p.opp ?? null, body: p.body,
      created_at: new Date(now - (i + 1) * 3.7 * 3600000).toISOString(),
    }))).select("id, author_id, kind");
    const replies = ["Passei por isso. O que funcionou foi começar pequeno e pedir indicação de quem já confiava no meu trabalho.", "Posso ajudar. Me chama no privado que te mostro como fiz.", "Ótima pergunta, também quero saber.", "Faria um teste de uma semana e mediria o resultado antes de decidir."];
    const comments = (posts ?? []).slice(0, 14).map((p, i) => ({ post_id: p.id, author_id: at(i + 3) === p.author_id ? at(i + 4) : at(i + 3), body: replies[i % replies.length]!, offers_help: p.kind === "ajuda" && i % 2 === 0 }));
    await db.from("comments").insert(comments);
    await db.from("reactions").insert((posts ?? []).flatMap((p, i) => ids.slice(0, (i % 5) + 1).filter((u) => u !== p.author_id).map((u) => ({ post_id: p.id, user_id: u, kind: "like" }))));
    const { data: events } = await db.from("events").select("id, capacity").eq("is_demo", true);
    await db.from("event_bookings").insert((events ?? []).flatMap((e, i) => ids.slice(0, Math.min(e.capacity - 1, 3 + i)).map((u) => ({ event_id: e.id, user_id: u }))));
    if (events?.[0]) await db.from("event_questions").insert([
      { event_id: events[0].id, user_id: at(2), body: "Como abordar alguém mais experiente sem parecer interesseiro?" },
      { event_id: events[0].id, user_id: at(1), body: "Vale a pena ir a eventos sozinho? Como começar a conversa?" },
    ]);
    return { created: ids.length };
  });

/** Removes demo members (cascades to their content) and demo experts/events. Admin only. */
export const removeDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data } = await db.from("profiles").select("id").eq("is_demo", true);
    for (const p of data ?? []) await db.auth.admin.deleteUser(p.id);
    await db.from("events").delete().eq("is_demo", true);
    await db.from("experts").delete().eq("is_demo", true);
    return { removed: (data ?? []).length };
  });
