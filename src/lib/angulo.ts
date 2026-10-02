// Meu Ângulo: dados fixos (situações, objetivos, missões e recursos ligados).
// Nada aqui decide pela pessoa: só sugere o que explorar dentro da plataforma.

export const SITUATIONS = [
  "Trabalho", "Estudo", "Trabalho e estudo", "Empreendo", "Trabalho e empreendo",
  "Estou procurando trabalho", "Estou mudando de carreira", "Estou explorando possibilidades", "Outro",
] as const;

export const NOW_FIELDS = [
  { k: "area", l: "Área atual", ph: "Ex.: logística, atendimento, faculdade de direito" },
  { k: "experiencia", l: "Experiência", ph: "O que você já fez, em poucas linhas", ml: true },
  { k: "competencias", l: "Competências", ph: "O que você já sabe fazer bem" },
  { k: "funcionando", l: "O que está funcionando", ml: true },
  { k: "melhorar", l: "O que quero melhorar", ml: true },
  { k: "incomoda", l: "O que está me incomodando", ml: true },
  { k: "aprendendo", l: "O que estou aprendendo" },
] as const;

export const OPTIONAL_FIELDS = [
  { k: "tempo", l: "Tempo disponível por semana", ph: "Ex.: 3 horas" },
  { k: "cidade", l: "Cidade", ph: "Opcional" },
  { k: "formato", l: "Formato de trabalho que você busca", ph: "Presencial, remoto, híbrido…" },
  { k: "renda", l: "Faixa de renda", ph: "Opcional. Só você vê." },
] as const;

export type ResourceType = "course" | "tool" | "mission" | "community" | "people" | "opportunity";
export type Resource = { type: ResourceType; ref: string; label: string };
export type Objective = { key: string; label: string; actions: { title: string; res?: Resource }[] };

const C = (ref: string, label: string): Resource => ({ type: "course", ref, label });
const M = (ref: string, label: string): Resource => ({ type: "mission", ref, label });
const COMM: Resource = { type: "community", ref: "", label: "Comunidade" };
const PEOPLE: Resource = { type: "people", ref: "", label: "Pessoas da comunidade" };
const OPP: Resource = { type: "opportunity", ref: "", label: "Oportunidades" };

export const OBJECTIVES: Objective[] = [
  { key: "crescer", label: "Quero crescer na minha carreira", actions: [
    { title: "Descrever onde você está e onde quer chegar em 2 anos", res: C("carreira-nao-emprego", "Carreira, não emprego") },
    { title: "Escolher o próximo passo concreto (promoção, projeto, troca)", res: C("o-proximo-passo", "O próximo passo") },
    { title: "Pedir uma conversa de feedback com sua liderança", res: M("pedir-feedback", "Peça um feedback de verdade") },
    { title: "Revisar o que descobriu em 30 dias" },
  ] },
  { key: "mudar", label: "Quero mudar de carreira", actions: [
    { title: "Conversar com 3 pessoas que trabalham nas áreas que você considera", res: M("tres-profissionais", "Converse com 3 profissionais") },
    { title: "Mapear quais habilidades você já leva para a nova área", res: C("mudar-de-carreira", "Mudar de carreira") },
    { title: "Pesquisar 10 vagas reais e anotar o que se repete", res: M("cinco-vagas", "Encontre 5 vagas que você queria ter") },
    { title: "Escolher uma habilidade para testar durante 30 dias" },
    { title: "Revisar o que descobriu" },
  ] },
  { key: "primeiro", label: "Quero meu primeiro emprego", actions: [
    { title: "Montar seu kit: currículo, apresentação e lista de alvos", res: C("chegue-forte-ao-mercado", "Chegue forte ao mercado") },
    { title: "Encontrar 5 vagas que você realmente gostaria de ter", res: M("cinco-vagas", "Encontre 5 vagas que você queria ter") },
    { title: "Pedir feedback sobre seu currículo a alguém da área", res: M("feedback-cv", "Peça feedback sobre seu currículo") },
    { title: "Treinar respostas para as perguntas difíceis", res: C("entrevista-sem-resposta-decorada", "Entrevista sem resposta decorada") },
    { title: "Acompanhar vagas e estágios publicados", res: OPP },
  ] },
  { key: "ganhar", label: "Quero ganhar melhor", actions: [
    { title: "Ver para onde seu dinheiro vai hoje", res: C("dinheiro-sem-complicacao", "Dinheiro sem complicação") },
    { title: "Identificar o próximo passo que paga mais na sua área", res: C("o-proximo-passo", "O próximo passo") },
    { title: "Conversar com alguém que ganha o que você quer ganhar", res: M("tres-profissionais", "Converse com 3 profissionais") },
    { title: "Revisar o que descobriu" },
  ] },
  { key: "habilidade", label: "Quero aprender uma habilidade", actions: [
    { title: "Escolher uma habilidade e um motivo concreto para ela" },
    { title: "Testar a habilidade numa tarefa real do seu dia", res: M("tarefa-ia", "Teste a IA numa tarefa repetitiva") },
    { title: "Mostrar o resultado para alguém e pedir opinião", res: COMM },
  ] },
  { key: "comunicacao", label: "Quero melhorar minha comunicação", actions: [
    { title: "Fazer o curso de comunicação profissional", res: C("comunicacao-profissional", "Comunicação profissional") },
    { title: "Preparar sua apresentação de 30 segundos e testar com 3 pessoas" },
    { title: "Pedir um feedback sobre como você se comunica", res: M("pedir-feedback", "Peça um feedback de verdade") },
  ] },
  { key: "rede", label: "Quero construir uma rede de contatos", actions: [
    { title: "Começar pelo curso Networking do zero", res: C("networking-do-zero", "Networking do zero") },
    { title: "Entrar em contato com 3 pessoas sem pedir nada", res: M("tres-contatos", "Fale com 3 pessoas sem pedir nada") },
    { title: "Reconectar com alguém de 12 meses atrás", res: M("reconectar", "Reconecte-se com alguém") },
    { title: "Apresentar-se na comunidade", res: PEOPLE },
  ] },
  { key: "profissao", label: "Quero entrar em uma profissão", actions: [
    { title: "Entender como a profissão funciona na prática", res: M("tres-profissionais", "Converse com 3 profissionais") },
    { title: "Se for corretagem: montar seu plano de 90 dias", res: C("corretor-do-zero", "Corretor do zero") },
    { title: "Analisar 5 casos reais da profissão na sua região", res: M("cinco-imoveis", "Analise 5 imóveis reais") },
  ] },
  { key: "organizar", label: "Quero me organizar melhor", actions: [
    { title: "Organizar o dinheiro do mês", res: C("dinheiro-sem-complicacao", "Dinheiro sem complicação") },
    { title: "Escolher 3 prioridades para as próximas 4 semanas" },
    { title: "Revisar a semana toda sexta, por 4 semanas" },
  ] },
  { key: "negocio", label: "Quero começar um negócio", actions: [
    { title: "Escrever sua ideia em uma frase e validar", res: { type: "tool", ref: "validador", label: "Validador de ideias" } },
    { title: "Conversar com 10 potenciais clientes antes de construir", res: M("dez-clientes", "Converse com 10 potenciais clientes") },
    { title: "Seguir o curso até os primeiros clientes", res: C("da-ideia-aos-primeiros-clientes", "Da ideia aos primeiros clientes") },
  ] },
  { key: "melhorar-negocio", label: "Quero melhorar meu negócio", actions: [
    { title: "Fazer as contas de viabilidade", res: { type: "tool", ref: "viabilidade", label: "Calculadora de viabilidade" } },
    { title: "Fazer 5 conversas reais de venda com roteiro", res: M("cinco-vendas", "Faça 5 conversas de venda") },
    { title: "Rever seu processo de vendas", res: C("vendas-da-conversa-ao-cliente", "Vendas: da conversa ao cliente") },
  ] },
  { key: "nao-sei", label: "Ainda não sei", actions: [
    { title: "Responder às perguntas de exploração" },
    { title: "Conversar com alguém que faz algo que desperta sua curiosidade", res: M("tres-profissionais", "Converse com 3 profissionais") },
    { title: "Escolher uma coisa pequena para testar por 2 semanas" },
  ] },
];

export const EXPLORE_QUESTIONS = [
  { k: "incomoda", q: "O que mais incomoda você hoje?" },
  { k: "doze", q: "O que você gostaria que estivesse diferente daqui a 12 meses?" },
  { k: "aprender", q: "O que você gostaria de aprender?" },
  { k: "curiosidade", q: "Que tipo de trabalho desperta sua curiosidade?" },
  { k: "nao", q: "O que você definitivamente não quer?" },
];

export type Mission = {
  key: string; area: string; title: string; why: string; steps: string[];
  questions?: string[]; effort: string; course?: string; evidence: string; reflection: string;
};

export const MISSIONS: Mission[] = [
  { key: "tres-profissionais", area: "Carreira", title: "Converse com 3 profissionais", effort: "2 a 3 semanas, cerca de 30 min por conversa", course: "mudar-de-carreira",
    why: "Antes de decidir se uma carreira parece interessante, descubra como ela funciona para quem trabalha nela.",
    steps: ["Liste 5 pessoas que trabalham na área (amigos de amigos, LinkedIn, comunidade).", "Peça 20 minutos explicando por que quer conversar.", "Converse com pelo menos 3 e anote as respostas."],
    questions: ["Como você entrou nessa área?", "O que gostaria de ter sabido antes?", "Qual habilidade mais importa?", "Que parte do trabalho as pessoas entendem errado?", "O que mais surpreendeu você?"],
    evidence: "Notas das 3 conversas", reflection: "O que você descobriu?" },
  { key: "cinco-vagas", area: "Carreira", title: "Encontre 5 vagas que você realmente gostaria de ter", effort: "1 a 2 horas", course: "chegue-forte-ao-mercado",
    why: "Vagas reais mostram o que o mercado pede, melhor do que qualquer opinião.",
    steps: ["Busque vagas que você aceitaria com vontade, não só as que acha possíveis.", "Salve 5 links.", "Anote os requisitos que se repetem e os que você ainda não tem."],
    evidence: "Lista das 5 vagas com requisitos", reflection: "O que se repete nas vagas e o que falta para você?" },
  { key: "feedback-cv", area: "Carreira", title: "Peça feedback sobre seu currículo", effort: "1 semana", course: "linkedin-cv-e-presenca",
    why: "Quem contrata ou trabalha na área vê coisas que você não vê.",
    steps: ["Escolha 2 pessoas da área que você quer.", "Mande o currículo com uma pergunta específica: o que você cortaria?", "Anote o que as duas disseram em comum."],
    evidence: "Feedback recebido", reflection: "O que você vai mudar a partir do feedback?" },
  { key: "pedir-feedback", area: "Comunicação", title: "Peça um feedback de verdade", effort: "1 conversa de 20 min", course: "comunicacao-profissional",
    why: "Crescer sem saber como os outros veem seu trabalho é andar no escuro.",
    steps: ["Escolha alguém que acompanha seu trabalho.", "Pergunte: o que eu deveria começar, parar e continuar fazendo?", "Só escute e agradeça; não se defenda."],
    evidence: "O que foi dito", reflection: "O que surpreendeu você e o que vai testar?" },
  { key: "tres-contatos", area: "Networking", title: "Fale com 3 pessoas sem pedir nada em troca", effort: "1 semana", course: "networking-do-zero",
    why: "Relações começam com interesse genuíno, não com pedido.",
    steps: ["Escolha 3 pessoas cujo trabalho você admira.", "Mande uma mensagem curta comentando algo específico que elas fizeram.", "Não peça nada. Só abra a conversa."],
    evidence: "Mensagens enviadas e respostas", reflection: "Como foi? O que você faria diferente?" },
  { key: "reconectar", area: "Networking", title: "Reconecte-se com alguém com quem você não fala há 12 meses", effort: "15 minutos", course: "networking-do-zero",
    why: "As melhores oportunidades costumam vir de contatos que já existem.",
    steps: ["Pense em alguém de trabalhos, cursos ou escola anteriores.", "Mande uma mensagem simples perguntando como a pessoa está.", "Se a conversa fluir, proponha um café ou uma chamada."],
    evidence: "Com quem você falou", reflection: "O que você soube de novo?" },
  { key: "cinco-imoveis", area: "Corretor", title: "Analise 5 imóveis reais da sua região", effort: "2 horas", course: "corretor-do-zero",
    why: "Conhecer o produto é a base do trabalho de corretor.",
    steps: ["Escolha 5 anúncios reais perto de você.", "Compare preço por metro, localização e diferenciais.", "Anote qual você venderia primeiro e por quê."],
    evidence: "Comparação dos 5 imóveis", reflection: "O que você aprendeu sobre o mercado da sua região?" },
  { key: "dez-clientes", area: "Negócios", title: "Converse com 10 potenciais clientes antes de construir", effort: "2 semanas", course: "da-ideia-aos-primeiros-clientes",
    why: "Construir antes de ouvir é a forma mais cara de descobrir que ninguém quer.",
    steps: ["Liste 15 pessoas que teriam o problema.", "Pergunte sobre a última vez que viveram o problema, sem apresentar sua ideia.", "Anote padrões depois de 10 conversas."],
    evidence: "Resumo das 10 conversas", reflection: "O problema existe do jeito que você imaginava?" },
  { key: "cinco-vendas", area: "Vendas", title: "Faça 5 conversas reais usando seu roteiro", effort: "1 semana", course: "vendas-da-conversa-ao-cliente",
    why: "Roteiro só melhora quando encontra pessoas reais.",
    steps: ["Revise seu roteiro de conversa.", "Faça 5 conversas reais.", "Depois de cada uma, anote onde travou."],
    evidence: "Notas das 5 conversas", reflection: "Qual parte do roteiro você vai mudar?" },
  { key: "tarefa-ia", area: "IA", title: "Teste a IA numa tarefa repetitiva real por uma semana", effort: "1 semana, 15 min por dia", course: "ia-no-trabalho",
    why: "IA só faz sentido quando resolve algo do seu dia, não em demonstração.",
    steps: ["Escolha uma tarefa que você repete toda semana.", "Monte um passo a passo com IA e use por 5 dias.", "Compare tempo e qualidade com o jeito antigo."],
    evidence: "Antes e depois da tarefa", reflection: "Vale manter? O que precisou de revisão humana?" },
];

export const findMission = (k: string) => MISSIONS.find((m) => m.key === k);
export const findObjective = (k?: string | null) => OBJECTIVES.find((o) => o.key === k);

export const STATUS_LABEL = { todo: "A fazer", doing: "Em andamento", done: "Concluído" } as const;
