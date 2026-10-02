import type { Course } from "./types";
import { mod } from "./build";

const ML = true;

export const COMUNICACAO: Course = {
  slug: "comunicacao-profissional",
  title: "Comunicação profissional",
  thesis: "Fale, escreva e se posicione com mais clareza no trabalho.",
  category: "Comunicação", difficulty: "Fundamentos", commitment: "5 módulos · cerca de 25 min de prática cada",
  project: "Meu playbook de comunicação",
  outcomes: ["Minha mensagem mais clara", "Meus modelos de escrita", "Minha estrutura de fala", "Meu roteiro de conversa difícil", "Meu jeito de discordar"],
  tools: ["Reescritor de mensagens", "Estrutura de fala", "Roteiro de conversa difícil"],
  next: [{ slug: "o-proximo-passo", why: "Use a comunicação para pedir o que você quer." }, { slug: "vendas-da-conversa-ao-cliente", why: "Vender também é explicar valor com clareza." }],
  modules: [
    mod("co01", "Clareza começa antes de falar", "O que você quer que a outra pessoa entenda, sinta ou faça?", {
      title: "Uma mensagem, um objetivo",
      what: "Antes de escrever ou falar, defina: para quem é, o que a pessoa precisa saber e o que você espera que ela faça.",
      why: "A maior parte da confusão no trabalho vem de mensagens sem objetivo claro.",
      example: "Em vez de três parágrafos sobre um atraso: “O relatório sai quinta, não terça. Preciso que você aprove o novo prazo até amanhã”.",
      mistake: "Começar pelo contexto todo e deixar o pedido para o final.",
    }, "Como deixar uma mensagem clara", [
      { type: "compare", before: "Oi! Então, sobre aquele assunto, estive pensando e talvez fosse bom a gente ver se dá para mudar algumas coisas…", after: "Proposta: mover a reunião de status para quinta. Motivo: os dados só chegam na quarta. Você concorda?" },
      { type: "fields", key: "co01.mensagem", title: "Reescreva uma mensagem real", fields: [
        { k: "antes", l: "Uma mensagem que você mandou recentemente", multiline: ML }, { k: "objetivo", l: "O que eu queria que a pessoa fizesse" }, { k: "depois", l: "Versão mais clara", multiline: ML }] },
    ], "Minha mensagem mais clara", "Compartilhe um antes e depois de uma mensagem sua.", "Escrever melhor no dia a dia."),
    mod("co02", "Escrever no trabalho", "Seus e-mails e mensagens são fáceis de responder?", {
      title: "Pedido primeiro, contexto depois",
      what: "Mensagens de trabalho funcionam com assunto claro, pedido no começo, contexto curto e prazo explícito.",
      why: "As pessoas leem no celular, entre reuniões. Quanto mais fácil responder, mais rápido a resposta vem.",
      example: "Assunto: “Aprovação do orçamento até sexta”. Primeira linha: “Preciso da sua aprovação para o orçamento em anexo até sexta”.",
      mistake: "Mandar várias perguntas misturadas em um parágrafo só.",
    }, null, [{ type: "fields", key: "co02.modelos", title: "Meus modelos", fields: [
      { k: "pedido", l: "Modelo de pedido", multiline: ML }, { k: "atualizacao", l: "Modelo de atualização de status", multiline: ML }, { k: "cobranca", l: "Modelo de cobrança educada", multiline: ML }] }],
    "Meus modelos de escrita", "Qual tipo de mensagem você mais demora para escrever?", "Falar em reuniões e apresentações."),
    mod("co03", "Falar em reunião sem travar", "Como organizar uma ideia em poucos segundos?", {
      title: "Ponto, motivo, exemplo, ponto",
      what: "Uma estrutura simples: diga sua ideia, explique por quê, dê um exemplo e repita a ideia. Serve para reuniões, apresentações e perguntas inesperadas.",
      why: "Ter uma estrutura reduz o nervosismo, porque você sabe o caminho da fala.",
      example: "“Acho que devemos testar primeiro com um cliente. Porque reduz o risco. No projeto passado, testamos com um e evitamos retrabalho. Então, proponho começar pequeno.”",
      mistake: "Pedir desculpas antes de falar (“talvez seja bobagem, mas…”).",
    }, "Uma estrutura para falar em reunião", [{ type: "scenarios", key: "co03.fala", title: "Pratique a estrutura", intro: "Responda a cada situação usando ponto, motivo, exemplo, ponto.", items: ["Sua liderança pergunta sua opinião sobre um prazo.", "Você precisa apresentar um resultado em 2 minutos.", "Alguém pergunta algo que você não sabe responder."], framework: ["Ponto", "Motivo", "Exemplo", "Ponto de novo"] }],
    "Minha estrutura de fala", "Como você lida com perguntas que não sabe responder?", "Preparar conversas difíceis."),
    mod("co04", "Conversas difíceis", "Que conversa você está adiando?", {
      title: "Fato, impacto, pedido",
      what: "Conversas difíceis ficam mais leves quando você separa o fato (o que aconteceu), o impacto (o que causou) e o pedido (o que você gostaria).",
      why: "Adiar conversas costuma piorar a situação. Uma estrutura evita acusações e ajuda a pessoa a ouvir.",
      example: "“Nas últimas duas entregas, recebi os dados no dia do prazo (fato). Isso me fez virar a noite (impacto). Podemos combinar envio até a véspera? (pedido)”",
      mistake: "Falar sobre a personalidade da pessoa em vez do comportamento.",
    }, null, [
      { type: "classify", key: "co04.fatos", prompt: "Isso é fato ou julgamento?", categories: ["Fato", "Julgamento"], items: [
        { t: "Você chegou 20 minutos atrasado nas três últimas reuniões.", a: "Fato" }, { t: "Você não se importa com o time.", a: "Julgamento" },
        { t: "O relatório veio sem a parte de custos.", a: "Fato" }, { t: "Você é desorganizado.", a: "Julgamento", why: "Descreva o comportamento, não a pessoa." }] },
      { type: "fields", key: "co04.roteiro", title: "Meu roteiro", fields: [
        { k: "com", l: "Com quem" }, { k: "fato", l: "Fato" }, { k: "impacto", l: "Impacto" }, { k: "pedido", l: "Pedido" }, { k: "reacao", l: "Como vou reagir se a pessoa discordar", multiline: ML }] },
    ], "Meu roteiro de conversa difícil", "Como você começa uma conversa difícil sem soar agressivo?", "Aprender a discordar e se posicionar."),
    mod("co05", "Discordar e se posicionar", "Como dizer “não” ou “discordo” sem prejudicar a relação?", {
      title: "Respeito pela pessoa, firmeza na ideia",
      what: "Posicionar-se é dizer o que você pensa com argumentos, reconhecendo o ponto do outro. Dizer não é proteger prioridades, não recusar trabalho.",
      why: "Quem nunca discorda passa a ser visto como alguém sem opinião; quem discorda mal perde aliados.",
      example: "“Entendo a urgência. Se eu assumir isso agora, o relatório atrasa uma semana. Qual dos dois é prioridade?”",
      mistake: "Dizer sim para tudo e entregar tudo pela metade.",
    }, null, [{ type: "fields", key: "co05.posicao", title: "Meu jeito de discordar", fields: [
      { k: "situacao", l: "Uma situação em que eu deveria ter me posicionado", multiline: ML }, { k: "frase", l: "O que eu diria hoje", multiline: ML }, { k: "nao", l: "Minha frase para dizer não protegendo prioridades" }] }],
    "Meu jeito de discordar", "Qual é a sua frase para dizer não sem fechar portas?", "Revisar seu playbook no seu espaço."),
  ],
  finalPlan: { title: "Meu playbook de comunicação", sections: [
    { t: "Clareza", keys: ["co01.mensagem"] }, { t: "Escrita", keys: ["co02.modelos"] }, { t: "Fala", keys: ["co03.fala"] },
    { t: "Conversas difíceis", keys: ["co04.roteiro"] }, { t: "Posicionamento", keys: ["co05.posicao"] }] },
};

export const DINHEIRO: Course = {
  slug: "dinheiro-sem-complicacao",
  title: "Dinheiro sem complicação",
  thesis: "Entenda a matemática da sua vida financeira sem precisar virar especialista em finanças.",
  category: "Dinheiro", difficulty: "Iniciante", commitment: "5 módulos · cerca de 25 min de prática cada",
  project: "Meu mapa financeiro",
  outcomes: ["Meu retrato do mês", "Meus gastos por categoria", "Meu plano para dívidas", "Minha reserva", "Minha rotina financeira"],
  tools: ["Retrato do mês", "Organizador de dívidas", "Calculadora de reserva"],
  next: [{ slug: "o-proximo-passo", why: "Com o dinheiro organizado, decisões de carreira ficam mais leves." }, { slug: "mudar-de-carreira", why: "Uma reserva dá fôlego para uma transição." }],
  modules: [
    mod("d01", "O retrato do mês", "Quanto entra e quanto sai, de verdade?", {
      title: "Começar pelos números reais",
      what: "O retrato do mês soma tudo que entra (salário, extras) e tudo que sai (fixos, variáveis, parcelas). Use o extrato e a fatura do cartão, não a memória.",
      why: "É difícil decidir qualquer coisa sobre dinheiro sem saber se o mês fecha no positivo ou no negativo.",
      example: "Entra R$3.200. Fixos R$1.900, cartão R$1.100, outros R$400. O mês fecha R$200 negativo, coberto pelo limite da conta.",
      mistake: "Estimar de cabeça. Quase sempre o gasto real é maior do que a gente lembra.",
    }, "Como fazer o retrato do seu mês", [{ type: "fields", key: "d01.retrato", title: "Meu retrato do mês", help: "Fica só com você. Pode usar valores aproximados.", fields: [
      { k: "entra", l: "Quanto entra por mês (R$)" }, { k: "fixos", l: "Gastos fixos (R$)" }, { k: "variaveis", l: "Gastos variáveis (R$)" },
      { k: "parcelas", l: "Parcelas e dívidas (R$)" }, { k: "saldo", l: "O que sobra ou falta" }, { k: "surpresa", l: "O que me surpreendeu", multiline: ML }] }],
    "Meu retrato do mês", "O que mais te surpreendeu ao fazer o retrato do mês? (sem precisar dizer valores)", "Entender para onde o dinheiro vai."),
    mod("d02", "Para onde o dinheiro vai", "Quais gastos você escolheria de novo?", {
      title: "Essencial, importante, dispensável",
      what: "Separar gastos em essenciais (moradia, comida, transporte), importantes (o que melhora sua vida) e dispensáveis (o que você nem lembra de ter comprado).",
      why: "Cortar tudo não dura. Cortar o dispensável e manter o importante é mais sustentável.",
      example: "Três assinaturas de streaming pouco usadas somam o valor de uma academia que você usaria.",
      mistake: "Achar que pequenos gastos não importam. Somados no mês, costumam pesar.",
    }, null, [
      { type: "classify", key: "d02.classificar", prompt: "Como você classificaria esses gastos comuns?", categories: ["Essencial", "Importante", "Dispensável"], items: [
        { t: "Aluguel", a: "Essencial" }, { t: "Curso que ajuda no trabalho", a: "Importante" }, { t: "Assinatura que não uso há meses", a: "Dispensável" },
        { t: "Mercado do mês", a: "Essencial" }, { t: "Taxa de entrega em todo pedido", a: "Dispensável", why: "Depende da frequência; somada no mês, costuma pesar." }, { t: "Encontro com amigos", a: "Importante", why: "Bem-estar também conta. A questão é caber no mês." }] },
      { type: "groups", key: "d02.meus", title: "Meus gastos", groups: ["Essencial", "Importante", "Dispensável"], ph: "Ex.: delivery" },
    ], "Meus gastos por categoria", "Qual gasto dispensável você descobriu que tinha?", "Olhar para as dívidas."),
    mod("d03", "Dívidas sem vergonha", "Quais dívidas custam mais caro?", {
      title: "Juros decidem a ordem",
      what: "Liste cada dívida com valor, parcela e taxa de juros. As mais caras costumam ser cartão rotativo e cheque especial, que vale priorizar.",
      why: "Pagar primeiro a dívida mais cara reduz o total que você paga no fim. Renegociar também é uma opção.",
      example: "Rotativo do cartão com juros muito altos ao mês deve vir antes de um financiamento com juros menores.",
      mistake: "Pagar o mínimo do cartão todo mês achando que está resolvendo.",
    }, null, [{ type: "list", key: "d03.dividas", title: "Minhas dívidas", max: 8, statusLabel: "Prioridade", statuses: ["Alta (juros altos)", "Média", "Baixa"], fields: [
      { k: "qual", l: "Dívida" }, { k: "valor", l: "Valor total e parcela" }, { k: "juros", l: "Juros ao mês (se souber)" }] },
      { type: "question", key: "d03.plano", prompt: "Qual dívida vou atacar primeiro e o que vou fazer (pagar a mais, renegociar, trocar por uma mais barata)?" }],
    "Meu plano para dívidas", "Alguém já renegociou uma dívida? Como foi a conversa?", "Construir uma reserva."),
    mod("d04", "A reserva que dá fôlego", "Quanto você precisaria para atravessar alguns meses sem renda?", {
      title: "Reserva antes de investimento",
      what: "Reserva de emergência é um valor guardado em lugar seguro e de fácil acesso para imprevistos: perder renda, saúde, conserto urgente.",
      why: "Sem reserva, qualquer imprevisto vira dívida cara. Com ela, você também ganha liberdade para decisões de carreira.",
      example: "Gastos essenciais de R$2.000 por mês: uma reserva de 3 meses é R$6.000. Guardando R$200 por mês, a primeira meta pode ser R$1.000.",
      mistake: "Achar que precisa juntar tudo de uma vez. Começar pequeno também conta.",
    }, "Por que a reserva vem primeiro", [{ type: "fields", key: "d04.reserva", title: "Minha reserva", help: "Este curso não recomenda investimentos específicos.", fields: [
      { k: "essenciais", l: "Meus gastos essenciais por mês (R$)" }, { k: "meses", l: "Quantos meses quero cobrir", options: ["1 mês para começar", "3 meses", "6 meses"] },
      { k: "meta", l: "Minha meta total (R$)" }, { k: "mensal", l: "Quanto consigo guardar por mês (R$)" }, { k: "onde", l: "Onde vou guardar e por quê", multiline: ML }] }],
    "Minha reserva", "Qual foi o primeiro passo que te ajudou a começar uma reserva?", "Criar uma rotina simples."),
    mod("d05", "Uma rotina de 15 minutos", "Como manter isso sem planilha complicada?", {
      title: "Revisar pouco, mas sempre",
      what: "Uma revisão semanal curta (o que gastei, estou no plano?) e uma mensal (retrato do mês, dívidas, reserva).",
      why: "Organização financeira não é um evento. É um hábito pequeno que evita sustos.",
      example: "Todo domingo, 15 minutos olhando o extrato. Todo dia 5, transferência automática para a reserva.",
      mistake: "Montar uma planilha perfeita e abandonar na segunda semana.",
    }, null, [{ type: "fields", key: "d05.rotina", title: "Minha rotina financeira", fields: [
      { k: "semanal", l: "Minha revisão semanal: quando e o que olho" }, { k: "mensal", l: "Minha revisão mensal: quando e o que olho" },
      { k: "automatico", l: "O que posso automatizar" }, { k: "regra", l: "Uma regra simples que vou seguir (ex.: esperar 48h antes de compras acima de R$200)" }] }],
    "Minha rotina financeira", "Qual regra simples ajuda você a não gastar por impulso?", "Revisar seu mapa no seu espaço."),
  ],
  finalPlan: { title: "Meu mapa financeiro", sections: [
    { t: "Retrato do mês", keys: ["d01.retrato"] }, { t: "Gastos", keys: ["d02.meus"] }, { t: "Dívidas", keys: ["d03.dividas", "d03.plano"] },
    { t: "Reserva", keys: ["d04.reserva"] }, { t: "Rotina", keys: ["d05.rotina"] }] },
};
