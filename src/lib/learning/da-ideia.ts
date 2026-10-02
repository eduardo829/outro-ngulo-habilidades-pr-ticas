import type { Course } from "./types";

const V = (title: string) => ({ type: "video" as const, title, duration: "a definir" });

export const DA_IDEIA: Course = {
  slug: "da-ideia-aos-primeiros-clientes",
  title: "Da ideia aos primeiros clientes",
  thesis: "Um processo prático para transformar uma ideia em evidência antes de comprometer tempo e dinheiro demais.",
  gestor: "eduardo-araujo",
  difficulty: "Iniciante",
  commitment: "10 módulos, no seu ritmo. Cada um deixa algo pronto.",
  outcomes: ["Uma hipótese clara", "Um cliente definido", "Uma oferta", "Uma primeira análise financeira", "Um experimento de validação", "Uma lista de prospects", "Um script inicial", "Evidências reais", "Um plano de 30 dias"],
  tools: ["Validador de ideias", "Calculadora de viabilidade", "Plano de validação"],
  modules: [
    {
      key: "m01", title: "A ideia não importa tanto quanto você pensa", question: "Por que alguém pagaria por isso?",
      blocks: [
        { type: "question", key: "m01.antes", prompt: "Descreva sua ideia em uma frase. Por que você acredita que alguém pagaria por ela?" },
        { type: "fields", key: "m01.base", title: "Antes do vídeo", fields: [{ k: "problema", l: "Qual problema resolve?" }, { k: "quem", l: "Quem provavelmente pagaria?" }, { k: "agora", l: "Por que compraria agora?" }] },
        V("A ideia não importa tanto quanto você pensa"),
        { type: "fields", key: "m01.hipotese", title: "Reescreva: cliente + problema + resultado", help: "Depois dessa aula, você responderia diferente?", fields: [{ k: "cliente", l: "Cliente", ph: "Ex.: donos de pet que trabalham fora" }, { k: "problema", l: "Problema", ph: "Ex.: o cachorro fica sozinho 10 horas" }, { k: "resultado", l: "Resultado", ph: "Ex.: um passeio garantido no meio do dia" }] },
        { type: "compare", before: "m01.antes", after: "m01.hipotese", title: "Antes e depois" },
      ],
      output: { key: "m01.hipotese", title: "Hipótese inicial" },
      community: "Qual foi a maior mudança entre a sua primeira frase e a hipótese reescrita?",
      next: "Descrever quem é, de verdade, o seu primeiro cliente.",
    },
    {
      key: "m02", title: "Quem realmente compraria?", question: "Você consegue descrever seu primeiro cliente?",
      blocks: [
        V("Quem realmente compraria?"),
        { type: "fields", key: "m02.cliente", title: "Meu primeiro cliente", fields: [
          { k: "tipo", l: "Pessoa ou empresa?", options: ["Pessoa", "Empresa"] }, { k: "onde", l: "Onde está?" }, { k: "hoje", l: "O que já faz para resolver o problema?" },
          { k: "custo", l: "Quanto o problema custa para ela?" }, { k: "decide", l: "Quem decide a compra?" }, { k: "trava", l: "O que faria essa pessoa não comprar?" }] },
      ],
      output: { key: "m02.cliente", title: "Meu primeiro cliente" },
      community: "Quem você imaginava como cliente e quem você descobriu que é?",
      next: "Separar o que você sabe do que você está imaginando.",
    },
    {
      key: "m03", title: "Existe demanda ou você está imaginando?", question: "Que evidência você tem de que esse problema existe?",
      blocks: [
        { type: "choices", key: "m03.evidencias", prompt: "Marque o que você realmente tem hoje:", multi: true, options: ["Tenho clientes", "Já vendi algo parecido", "Pessoas já pediram isso", "Observei o problema", "Vi concorrentes vendendo", "Pesquisa online", "Nenhuma evidência ainda"] },
        V("Existe demanda ou você está imaginando?"),
        { type: "tool", tool: "validador", key: "m03.validador", intro: "Use o Validador de ideias e registre aqui o que ele apontou." },
        { type: "question", key: "m03.suposicao", prompt: "Qual é a maior suposição que ainda precisa ser provada?" },
      ],
      output: { key: "m03.evidencias", title: "Evidências atuais" },
      community: "Qual é a hipótese mais difícil de provar no seu negócio?",
      next: "Ver se a conta fecha antes de investir.",
    },
    {
      key: "m04", title: "A matemática fecha?", question: "Quantas vendas você precisa para valer a pena?",
      blocks: [
        V("A matemática fecha?"),
        { type: "tool", tool: "viabilidade", key: "m04.economia", intro: "Ajuste os números do seu negócio. O resultado é salvo no seu espaço." },
      ],
      output: { key: "m04.economia", title: "Economia do negócio" },
      community: "Qual número da calculadora mais te surpreendeu?",
      next: "Montar a oferta antes de construir o produto.",
    },
    {
      key: "m05", title: "Construa a oferta antes do produto", question: "O que exatamente alguém está comprando?",
      blocks: [
        V("Construa a oferta antes do produto"),
        { type: "fields", key: "m05.oferta", title: "Minha primeira oferta", fields: [
          { k: "para", l: "Para quem" }, { k: "problema", l: "Problema" }, { k: "oferta", l: "Oferta", multiline: true }, { k: "resultado", l: "Resultado esperado" },
          { k: "preco", l: "Preço" }, { k: "agora", l: "Por que agora" }, { k: "risco", l: "Risco percebido" }, { k: "objecoes", l: "Objeções prováveis" }, { k: "cta", l: "Próximo passo para o cliente (CTA)" }] },
      ],
      output: { key: "m05.oferta", title: "Minha primeira oferta" },
      community: "Leia sua oferta em voz alta. O que soou estranho?",
      next: "Descobrir do jeito mais barato se você está errado.",
    },
    {
      key: "m06", title: "Teste antes de investir", question: "Qual é a maneira mais barata de descobrir se você está errado?",
      blocks: [
        V("Teste antes de investir"),
        { type: "tool", tool: "plano", key: "m06.teste", intro: "Monte seu teste de 7 dias no Plano de validação e registre aqui o que vai medir." },
      ],
      output: { key: "m06.teste", title: "Meu teste de 7 dias" },
      community: "Qual número vai te dizer que o teste deu certo?",
      next: "Listar as primeiras 20 pessoas para oferecer.",
    },
    {
      key: "m07", title: "Encontre as primeiras 20 pessoas", question: "Para quem você vai oferecer primeiro?",
      blocks: [
        V("Encontre as primeiras 20 pessoas"),
        { type: "list", key: "m07.prospects", title: "Minha primeira lista de prospects", max: 20, statusLabel: "Status",
          statuses: ["Identificado", "Contactado", "Respondeu", "Conversando", "Oferta apresentada", "Comprou", "Não interessado"],
          fields: [{ k: "nome", l: "Nome / empresa" }, { k: "porque", l: "Por que pode ter o problema?" }, { k: "como", l: "Como posso chegar?" }, { k: "canal", l: "Canal" }] },
      ],
      output: { key: "m07.prospects", title: "Minha primeira lista de prospects" },
      community: "Qual canal está funcionando melhor para chegar nas pessoas?",
      next: "Praticar a conversa de venda.",
    },
    {
      key: "m08", title: "Venda antes de sofisticar", question: "O que você responde quando dizem que está caro?",
      blocks: [
        { type: "question", key: "m08.antes", prompt: "Um cliente diz: “Interessante, mas está caro.” Como você responderia?" },
        V("Venda antes de sofisticar"),
        { type: "scenarios", key: "m08.script", intro: "Agora responda novamente, usando o roteiro. Pratique também as outras objeções.",
          items: ["Interessante, mas está caro.", "Preciso pensar.", "Já uso outra solução.", "Não é prioridade agora.", "Me manda alguma coisa por WhatsApp."],
          framework: ["Agradeça e entenda: pergunte o que está por trás da objeção.", "Reconecte com o problema que a pessoa disse ter.", "Mostre o custo de não resolver.", "Proponha um próximo passo pequeno e concreto."] },
        { type: "compare", before: "m08.antes", after: "m08.script", title: "Antes e depois" },
      ],
      output: { key: "m08.script", title: "Meu primeiro script de vendas" },
      community: "Qual objeção você mais ouve e como está respondendo?",
      next: "Ler os sinais do que aconteceu.",
    },
    {
      key: "m09", title: "Leia os sinais", question: "O que as evidências estão dizendo?",
      blocks: [
        V("Leia os sinais"),
        { type: "fields", key: "m09.resultados", title: "Meus resultados", fields: [
          { k: "abordadas", l: "Pessoas abordadas" }, { k: "respostas", l: "Respostas" }, { k: "conversas", l: "Conversas" }, { k: "ofertas", l: "Ofertas apresentadas" },
          { k: "vendas", l: "Vendas" }, { k: "objecoes", l: "Principais objeções", multiline: true }, { k: "surpresas", l: "Feedback inesperado", multiline: true }] },
        { type: "decision", key: "m09.decisao", ask: "Qual decisão você está tomando e por quê?", paths: [
          { k: "Continuar", when: "Pessoas pagaram ou se comprometeram de verdade, e o número que você definiu foi atingido." },
          { k: "Ajustar", when: "Houve interesse, mas as mesmas objeções se repetem. Mude uma coisa e teste de novo." },
          { k: "Abandonar", when: "Quase ninguém se interessou mesmo depois de ajustar. Você economizou tempo e dinheiro." }] },
      ],
      output: { key: "m09.decisao", title: "Minha decisão" },
      community: "Qual sinal fez você decidir?",
      next: "Transformar o que aprendeu em 30 dias de ação.",
    },
    {
      key: "m10", title: "Dos primeiros clientes para um negócio", question: "O que vem nos próximos 30 dias?",
      blocks: [
        V("Dos primeiros clientes para um negócio"),
        { type: "choices", key: "m10.areas", prompt: "Escolha as áreas prioritárias:", multi: true, options: ["Clientes", "Produto", "Oferta", "Preço", "Operação", "Marketing", "Financeiro", "Networking"] },
        { type: "fields", key: "m10.plano", title: "Meus próximos 30 dias", fields: [
          { k: "prioridades", l: "3 prioridades", multiline: true }, { k: "metricas", l: "3 métricas", multiline: true },
          { k: "acoes", l: "3 ações desta semana", multiline: true }, { k: "naofazer", l: "3 coisas para NÃO fazer ainda", multiline: true }] },
      ],
      output: { key: "m10.plano", title: "Meus próximos 30 dias" },
      community: "Qual é a primeira ação da sua semana?",
      next: "Revisar seu plano de negócio, primeira versão.",
    },
  ],
  finalPlan: {
    title: "Meu plano de negócio — primeira versão",
    sections: [
      { t: "A ideia", keys: ["m01.hipotese"] }, { t: "Cliente", keys: ["m02.cliente"] }, { t: "Oferta e preço", keys: ["m05.oferta"] },
      { t: "Economia", keys: ["m04.economia"] }, { t: "Evidências", keys: ["m03.evidencias", "m03.validador", "m03.suposicao"] },
      { t: "Validação", keys: ["m06.teste"] }, { t: "Prospects", keys: ["m07.prospects"] }, { t: "Script", keys: ["m08.script"] },
      { t: "Resultados", keys: ["m09.resultados"] }, { t: "Decisão", keys: ["m09.decisao"] }, { t: "Próximos 30 dias", keys: ["m10.areas", "m10.plano"] },
    ],
  },
};

export const COURSES_ENGINE = [DA_IDEIA];
export const getEngineCourse = (slug: string) => COURSES_ENGINE.find((c) => c.slug === slug);
