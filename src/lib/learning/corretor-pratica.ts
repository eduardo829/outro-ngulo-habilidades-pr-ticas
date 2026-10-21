import type { Course } from "./types";
import { mod } from "./build";

const ML = true;

/** "Corretor na prática" — based on the authors' plan v1.1 (Sept 2026). 6 episodes = 6 modules, one video each. */
export const CORRETOR_PRATICA: Course = {
  slug: "corretor-na-pratica",
  title: "Corretor na prática",
  thesis: "Como começar com foco e conduzir vendas de imóveis: conhecer, ouvir, orientar e vender.",
  category: "Corretores",
  gestor: "vinicius-silva",
  difficulty: "Iniciante",
  commitment: "6 episódios · vídeo + exercício prático em cada um",
  project: "Meu plano de corretor",
  outcomes: [
    "Um diagnóstico profissional e um compromisso de foco",
    "Um nicho inicial escolhido com evidências",
    "Uma ficha de diagnóstico do cliente",
    "Um roteiro de checagem de produto e financiamento",
    "Um funil comercial com próximos passos",
    "Um exercício de viabilidade de lote + construção",
    "Um plano de ação de 30 dias",
  ],
  tools: ["Ficha de diagnóstico do cliente", "Leitura de mercado e produto", "Viabilidade de lote + construção", "Controle de oportunidades"],
  next: [
    { slug: "vendas-da-conversa-ao-cliente", why: "Aprofunde perguntas, objeções e follow-up em qualquer venda." },
    { slug: "networking-do-zero", why: "Indicações e parceiros sustentam a carteira de um corretor." },
    { slug: "dinheiro-sem-complicacao", why: "Comissão é irregular: organize seu próprio caixa." },
  ],
  modules: [
    mod("cp01", "Posicionamento e início no mercado", "Se um cliente sentasse hoje na sua frente, quais etapas você conseguiria explicar com segurança?", {
      title: "Comece pelo que você consegue dominar",
      what: "Posicionar-se é cruzar três fatores: uma demanda que você consegue alcançar, um produto que consegue entender e o apoio disponível para executar a operação. Antes de escolher, faça o diagnóstico do seu preparo e leia o mercado da sua região: bairros, emprego, deslocamentos, perfil das famílias, faixa de preços e oferta compatível com financiamento.",
      why: "Copiar o posicionamento de um corretor de alto padrão não cria conhecimento, acesso ao público nem carteira de clientes. Ticket menor também não significa operação simples.",
      example: "Um corretor recém-habilitado compara três hipóteses (primeiro apartamento, casa pronta de entrada, lote + construção), levanta 10 ofertas comparáveis em até três bairros, conversa com três profissionais locais e escolhe o nicho em que consegue prestar um bom serviço.",
      mistake: "Tratar anúncio como prova de liquidez. Valor anunciado, valor negociado e tempo até vender são coisas diferentes.",
    }, "Posicionamento e início no mercado", [
      { type: "fields", key: "cp01.diagnostico", title: "Diagnóstico profissional do corretor", help: "Para cada item: 0 = não sei; 1 = sei explicar com apoio; 2 = já executei e consigo demonstrar. A escala é didática, não certifica competência.", fields: [
        { k: "mercado", l: "Conhecer o mercado local (comparar três imóveis equivalentes)", options: ["0", "1", "2"] },
        { k: "cliente", l: "Entender o cliente (necessidade, orçamento, urgência, decisores)", options: ["0", "1", "2"] },
        { k: "operacao", l: "Entender a operação (etapas, custos, documentos, responsáveis)", options: ["0", "1", "2"] },
        { k: "venda", l: "Conduzir a venda (próximo passo, pendências, negociação)", options: ["0", "1", "2"] },
        { k: "relacoes", l: "Construir relações profissionais (a quem recorrer)", options: ["0", "1", "2"] },
        { k: "lacunas", l: "Minhas duas maiores lacunas e como vou corrigi-las", multiline: ML, ph: "Estudar uma fonte oficial, acompanhar um atendimento, revisar um caso com alguém experiente…" },
      ] },
      { type: "fields", key: "cp01.pesquisa", title: "Pesquisa de mercado inicial", help: "Metas de estudo sugeridas, não uma amostra estatística.", fields: [
        { k: "bairros", l: "Bairros pesquisados (até três)" },
        { k: "ofertas", l: "10 ofertas comparáveis: o que encontrei", multiline: ML },
        { k: "profissionais", l: "O que ouvi de três profissionais locais", multiline: ML },
        { k: "duvidas", l: "Cinco dúvidas recorrentes de compradores", multiline: ML },
        { k: "regras", l: "Onde consultar regras locais (prefeitura, plano diretor)" },
      ] },
      { type: "fields", key: "cp01.nicho", title: "Escolha de nicho", help: "Compare em demanda acessível, oferta adequada, capacidade de compra, domínio da operação e parceiros. Falta de documentação ou inviabilidade técnica não se compensa com uma boa nota.", fields: [
        { k: "nicho", l: "Meu nicho principal", options: ["Primeiro apartamento", "Casa pronta de entrada", "Lote + construção", "Outro"] },
        { k: "evidencias", l: "Evidências que sustentam a escolha", multiline: ML },
        { k: "pendentes", l: "Dúvidas pendentes", multiline: ML },
        { k: "compromisso", l: "Nos próximos 30 dias, vou estudar e atender [perfil] em [região], com foco em [produto]." },
      ] },
    ], "Meu diagnóstico e meu nicho", "Qual nicho você está considerando e qual evidência ainda falta?", "Entender o cliente antes de ofertar."),

    mod("cp02", "Entender o cliente", "O que precisa ficar claro antes de selecionar qualquer imóvel?", {
      title: "Perguntar antes de apresentar",
      what: "Transformar a conversa num diagnóstico: motivação, prioridades, quem decide, prazo, orçamento confortável, recursos e compromissos, experiência e receios. Só depois selecionar duas ou três opções compatíveis e registrar os dados com acesso restrito.",
      why: "Alinhar o sonho à realidade exige clareza e respeito; o cliente mantém o poder de escolher. Renda, isoladamente, não define o imóvel que alguém pode comprar.",
      example: "“Entendi que três quartos e esse bairro são importantes. Com os recursos informados, precisamos confirmar qual operação é viável. Podemos comparar um imóvel menor nessa região, outro bairro ou um prazo maior para formar entrada. Qual alternativa faz mais sentido para vocês?”",
      mistake: "Contar a venda futura de um carro como dinheiro disponível, ou confundir o valor que o cliente se sente confortável em pagar com a simulação e com o crédito aprovado.",
    }, "Entender o cliente", [
      { type: "fields", key: "cp02.ficha", title: "Ficha de diagnóstico do cliente", help: "Use um caso real anonimizado ou uma entrevista simulada em dupla. Não registre nomes nem documentos.", fields: [
        { k: "objetivo", l: "Objetivo e contexto (motivo, prazo, decisores, situação atual)", multiline: ML },
        { k: "prioridades", l: "Três prioridades e onde aceita flexibilizar", multiline: ML },
        { k: "recursos", l: "Recursos informados (renda, entrada, reserva, FGTS, compromissos)", multiline: ML },
        { k: "status", l: "Status da informação", options: ["Declarada pelo cliente", "Documentada", "Simulada", "Aprovada"] },
        { k: "receios", l: "Experiência anterior e receios", multiline: ML },
        { k: "encaminhamento", l: "Pendência, responsável, próxima ação e data", multiline: ML },
      ] },
      { type: "fields", key: "cp02.expectativas", title: "Alinhamento de expectativas e seleção", fields: [
        { k: "sonho", l: "O que o cliente imagina" },
        { k: "viavel", l: "O que parece viável com os recursos informados" },
        { k: "alternativas", l: "Alternativas para conversar (região, área, prazo…)", multiline: ML },
        { k: "selecao", l: "Duas ou três opções selecionadas e por que atendem ao diagnóstico", multiline: ML },
      ] },
    ], "Minha ficha de diagnóstico", "Qual pergunta mais mudou a sua recomendação num atendimento?", "Conferir produto, documentos e financiamento."),

    mod("cp03", "Produto, documentação e financiamento", "O que você precisa conferir antes de recomendar um imóvel?", {
      title: "Explicar a jornada sem prometer aprovação",
      what: "Antes de anunciar: autorização de comercialização, preço e condições atualizados, matrícula, situação da construção, pendências e histórico do fornecedor. Numa compra financiada: diagnóstico, simulação, interesse em prosseguir, análise pelo banco, condições resultantes, contratação, registro e liberação, entrega e pós-venda.",
      why: "O dever de informação faz parte da atuação do corretor. Simulação não é aprovação de crédito, e as condições aprovadas podem diferir do que foi simulado.",
      example: "Numa simulação fictícia, localizar entrada, financiamento, prazo, juros, sistema de amortização, indexador, seguros e Custo Efetivo Total (CET); comparar parcela mensal e custo total; mostrar onde verificar FGTS e eventual subsídio.",
      mistake: "Tratar FGTS ou subsídio como automáticos, ou dizer que o corretor “preenche a escritura”. Matrícula, escritura e registro são coisas diferentes; confirme com banco e cartório.",
    }, "Produto, documentação e financiamento", [
      { type: "fields", key: "cp03.produto", title: "Roteiro de checagem do produto", fields: [
        { k: "imovel", l: "Imóvel analisado (sem identificar o proprietário)" },
        { k: "autorizacao", l: "Autorização e preço vigente conferidos?", options: ["Sim", "Parcialmente", "Não"] },
        { k: "documentos", l: "Documentação recebida e pendências", multiline: ML },
        { k: "custos", l: "Custos de aquisição e manutenção conhecidos", multiline: ML },
        { k: "adequacao", l: "Para qual perfil de cliente faz sentido" },
        { k: "consultar", l: "Profissional a consultar e sobre o quê" },
      ] },
      { type: "fields", key: "cp03.financiamento", title: "Leitura de uma simulação", help: "Use uma simulação fictícia ou anonimizada.", fields: [
        { k: "entrada", l: "Entrada" }, { k: "financiado", l: "Valor financiado e prazo" },
        { k: "juros", l: "Juros, amortização e indexador" }, { k: "cet", l: "Seguros e CET" },
        { k: "fgts", l: "FGTS e subsídio: onde verificar e o que ainda falta confirmar", multiline: ML },
        { k: "explicacao", l: "Como eu explicaria ao cliente a diferença entre simulação e aprovação", multiline: ML },
      ] },
    ], "Meu roteiro de checagem", "Qual etapa do financiamento os seus clientes mais confundem?", "Organizar atendimento, negociação e venda."),

    mod("cp04", "Atendimento, negociação e venda", "Como avançar com o cliente sem perder a qualidade do atendimento?", {
      title: "Da conversa à venda e à indicação",
      what: "Uma rotina comercial que gera conversas qualificadas (contatos, indicações autorizadas, parcerias, conteúdo), conduz a visita retomando prioridades, trata objeções como informação, formaliza propostas e acompanha sem pressionar. Depois da entrega, o pós-venda constrói a carteira.",
      why: "Uma objeção pode revelar que a oferta precisa mudar. E nenhuma oportunidade deve ficar só “aguardando”: sempre há um próximo movimento e um responsável.",
      example: "“Você comentou que sua principal dúvida era o desembolso inicial. Organizei os itens que precisamos conferir e duas alternativas dentro das prioridades que conversamos. Podemos revisar juntos na data que combinamos?”",
      mistake: "Inventar urgência ou esconder limitações para conseguir uma assinatura. E aumentar o ticket só ampliando os números de uma venda anterior.",
    }, "Atendimento, negociação e venda", [
      { type: "fields", key: "cp04.rotina", title: "Minha rotina comercial", fields: [
        { k: "fontes", l: "De onde virão minhas conversas qualificadas", multiline: ML },
        { k: "visita", l: "Como vou abrir e fechar uma visita", multiline: ML },
        { k: "posvenda", l: "O que faço depois da entrega", multiline: ML },
      ] },
      { type: "scenarios", key: "cp04.objecoes", title: "Objeções", intro: "Responda a cada objeção. Primeiro identifique se o obstáculo é orçamento, insegurança, imóvel inadequado ou falta de informação.",
        items: ["A entrada está alta para nós.", "Vamos esperar mais um pouco.", "Gostamos, mas o bairro é longe do trabalho.", "Não sei se o banco vai aprovar."],
        framework: ["Pergunte o que está por trás.", "Retome o diagnóstico.", "Ajuste a oferta se for preciso.", "Combine um próximo passo com data."] },
      { type: "list", key: "cp04.funil", title: "Funil comercial: cinco oportunidades", max: 5, statusLabel: "Etapa", statuses: ["Contato", "Diagnóstico", "Seleção/visita", "Proposta", "Contratação", "Pós-venda"], fields: [
        { k: "caso", l: "Caso (fictício ou anonimizado)" }, { k: "acao", l: "Próxima ação" }, { k: "quando", l: "Data e responsável" }] },
    ], "Meu funil comercial", "Qual objeção você mais ouve no seu nicho?", "Entender a operação de lote + construção."),

    mod("cp05", "Lote + construção", "Por que o valor total menos o lote não define, sozinho, o orçamento da obra?", {
      title: "Compatibilizar cliente, terreno, projeto, custos e recursos",
      what: "A operação segue uma sequência: cliente e enquadramento; terreno e viabilidade; projeto e orçamento com responsável técnico; análise e contratação; execução com liberações por etapa; conclusão e regularização. Corretor, banco, engenheiro ou arquiteto, construtor e cliente respondem cada um pela sua frente.",
      why: "Ticket menor não significa operação simples. O dinheiro não é liberado todo no início, e uma estimativa por metro quadrado não substitui orçamento, escopo e cronograma.",
      example: "Caso A (simulação histórica, anonimizada): crédito + subsídio R$ 163.397,92; lote R$ 96.000 × 80% = R$ 76.800 para o lote; casa de 42 m² × R$ 2.200 = R$ 92.400; complementos do cliente = R$ 25.002,08. Com o CUB médio de SC de setembro de 2026 (R$ 3.158,88/m²), a mesma casa vai a R$ 132.672,96 e o complemento sobe para R$ 65.275,04.",
      mistake: "Tratar o CUB como preço final de entrega (ele exclui fundações, projetos, taxas e remuneração do construtor) ou a sobra aritmética de uma conta como dinheiro livre.",
    }, "Lote + construção", [
      { type: "tool", tool: "viabilidade", key: "cp05.calculo", intro: "Refaça a lógica com um caso seu ou fictício. Premissas como os 80% do lote vêm de casos históricos: confirme percentual, limites e distribuição na proposta do banco." },
      { type: "fields", key: "cp05.viabilidade", title: "Ficha de viabilidade de lote + construção", help: "Para cada valor, anote a fonte, a data e quem confirma.", fields: [
        { k: "terreno", l: "Terreno e documentação" }, { k: "obra", l: "Escopo e custo da obra (incluídos e excluídos)", multiline: ML },
        { k: "recursos", l: "Crédito, FGTS e recursos próprios: o que está confirmado", multiline: ML },
        { k: "sensibilidade", l: "Se o custo da obra subir 20%, o que acontece com o complemento?", multiline: ML },
        { k: "participantes", l: "Quem participa e por que cada um responde", multiline: ML },
      ] },
    ], "Minha análise de lote + construção", "Onde a conta de lote + construção costuma falhar na sua região?", "Organizar marketing, rotina e plano de 30 dias."),

    mod("cp06", "Marketing, organização e crescimento", "Como tornar sua especialidade compreensível e transformar isso numa rotina de 30 dias?", {
      title: "Redes sociais como ferramenta, números como bússola",
      what: "Um perfil com função deixa claro público, região, especialidade e contato, com identificação profissional conforme as regras do CRECI. Conteúdo que demonstra trabalho responde dúvidas reais. A rotina mede conversas qualificadas, avanço por etapa, conversão, tempo e resultado financeiro.",
      why: "Autoridade cresce quando o público entende o problema que você ajuda a resolver. Frequência, sozinha, não produz vendas.",
      example: "Seis publicações: por que a entrada não é o único gasto; três perguntas antes de visitar; o que observar num bairro; onde a conta de lote + construção falha; caso anonimizado de busca ajustada; imóvel alinhado ao nicho. 4 visitas em 10 diagnósticos = 40% naquele grupo, sem servir de promessa para outros.",
      mistake: "Publicar oferta sem conferir preço e disponibilidade, ou confundir simulação com condição aprovada no conteúdo.",
    }, "Marketing, organização e crescimento", [
      { type: "fields", key: "cp06.perfil", title: "Perfil e conteúdo", fields: [
        { k: "bio", l: "Minha apresentação do perfil reescrita", multiline: ML },
        { k: "canal", l: "Canal principal", options: ["Instagram", "Facebook", "TikTok", "LinkedIn", "Outro"] },
        { k: "pauta", l: "Minhas seis primeiras pautas", multiline: ML },
        { k: "rotina", l: "Rotina digital (dias de publicação e horário de resposta)" },
        { k: "ferramentas", l: "Ferramentas de atendimento que vou usar" },
      ] },
      { type: "fields", key: "cp06.plano", title: "Plano de ação de 30 dias", help: "Metas para testar um processo, sem promessa de fechar uma venda.", fields: [
        { k: "d1", l: "Dias 1 a 7", multiline: ML, ph: "Diagnóstico, 10 ofertas, três profissionais, escolher o nicho" },
        { k: "d8", l: "Dias 8 a 14", multiline: ML, ph: "Revisar três produtos, conhecer o fluxo de um banco, praticar duas entrevistas" },
        { k: "d15", l: "Dias 15 a 21", multiline: ML, ph: "Iniciar conversas, publicar três conteúdos, aplicar o diagnóstico" },
        { k: "d22", l: "Dias 22 a 30", multiline: ML, ph: "Acompanhar contatos, visitas viáveis, revisar objeções" },
        { k: "indicadores", l: "Indicadores que vou acompanhar", multiline: ML },
      ] },
      { type: "question", key: "cp06.avaliacao", prompt: "Avaliação do aprendizado: apresente um caso (real anonimizado ou fictício) com diagnóstico, nicho, escolha de produto, mapa da operação e próximo passo.", help: "A avaliação mede a coerência do processo; não depende de ter vendido." },
    ], "Meu plano de 30 dias", "Qual indicador você vai olhar primeiro no fim do mês?", "Revisar seu plano completo no seu espaço."),
  ],
  finalPlan: {
    title: "Meu plano de corretor",
    sections: [
      { t: "Diagnóstico e nicho", keys: ["cp01.diagnostico", "cp01.pesquisa", "cp01.nicho"] },
      { t: "Entender o cliente", keys: ["cp02.ficha", "cp02.expectativas"] },
      { t: "Produto e financiamento", keys: ["cp03.produto", "cp03.financiamento"] },
      { t: "Atendimento e venda", keys: ["cp04.rotina", "cp04.objecoes", "cp04.funil"] },
      { t: "Lote + construção", keys: ["cp05.calculo", "cp05.viabilidade"] },
      { t: "Plano de 30 dias", keys: ["cp06.perfil", "cp06.plano", "cp06.avaliacao"] },
    ],
  },
};
