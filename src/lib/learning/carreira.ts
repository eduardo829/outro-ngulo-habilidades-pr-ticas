import type { Course } from "./types";
import { mod } from "./build";

const ML = true;

export const KIT_PROFISSIONAL: Course = {
  slug: "chegue-forte-ao-mercado",
  title: "Chegue forte ao mercado de trabalho",
  thesis: "Construa uma apresentação profissional que mostre melhor o que você sabe fazer e onde pode gerar valor.",
  category: "Carreira", difficulty: "Iniciante", commitment: "5 módulos · cerca de 25 min de prática cada",
  project: "Meu kit profissional",
  outcomes: ["Meu inventário de experiências", "Minhas provas de competência", "Minha apresentação em 60 segundos", "Meu alvo de vagas", "Minha rotina de busca"],
  tools: ["Inventário de experiências", "Construtor de provas", "Roteiro de apresentação"],
  next: [
    { slug: "entrevista-sem-resposta-decorada", why: "Leve sua apresentação para a conversa de entrevista." },
    { slug: "linkedin-cv-e-presenca", why: "Transforme o kit em currículo e perfil." },
    { slug: "networking-do-zero", why: "Muitas vagas chegam por pessoas, não por anúncios." },
  ],
  modules: [
    mod("k01", "Você sabe mais do que acha", "O que você já fez que conta como experiência?", {
      title: "Experiência não é só emprego com carteira",
      what: "Experiência é qualquer situação em que você resolveu algo, aprendeu algo ou assumiu uma responsabilidade: trabalhos informais, projetos da faculdade, voluntariado, cuidar de um negócio da família, organizar um evento.",
      why: "Quem está começando costuma achar que não tem nada para mostrar e acaba se apresentando pelo que falta, não pelo que já fez.",
      example: "“Ajudei na loja do meu tio por dois anos” vira: atendi clientes, controlei estoque, fechei o caixa todos os dias.",
      mistake: "Descartar uma experiência porque ela não tem a ver com a área que você quer. Muitas habilidades atravessam áreas.",
    }, "O que conta como experiência", [
      { type: "list", key: "k01.inventario", title: "Inventário de experiências", max: 10, statusLabel: "Tipo", statuses: ["Trabalho", "Estudo", "Projeto", "Voluntariado", "Pessoal"], fields: [
        { k: "o", l: "O que foi" }, { k: "fiz", l: "O que eu fazia, na prática" }, { k: "aprendi", l: "O que aprendi" }] },
    ], "Meu inventário de experiências", "Qual experiência você quase esqueceu de contar, mas ensinou muito?", "Transformar experiências em provas."),
    mod("k02", "De tarefa a prova", "Como mostrar o que você sabe fazer, e não só dizer?", {
      title: "Situação, ação, resultado",
      what: "Uma prova de competência conta uma situação real, o que você fez e o que mudou. Pode ser pequeno: o importante é ser concreto.",
      why: "Quem avalia candidatos lê muitas listas de adjetivos. Um exemplo concreto é mais fácil de lembrar e de acreditar.",
      example: "Em vez de “sou organizado”: “Criei uma planilha de entregas para o grupo da faculdade e paramos de perder prazos no semestre”.",
      mistake: "Inventar ou inflar resultados. Se não houve número, descreva o que mudou com honestidade.",
    }, null, [
      { type: "compare", title: "Antes e depois", before: "Sou proativo, comunicativo e gosto de desafios.", after: "Quando o atendimento atrasava, organizei uma lista de respostas prontas para as perguntas mais comuns e o tempo de resposta caiu." },
      { type: "fields", key: "k02.provas", title: "Minhas três provas", fields: [
        { k: "p1", l: "Prova 1: situação, ação, resultado", multiline: ML },
        { k: "p2", l: "Prova 2: situação, ação, resultado", multiline: ML },
        { k: "p3", l: "Prova 3: situação, ação, resultado", multiline: ML }] },
    ], "Minhas provas de competência", "Compartilhe uma prova sua e peça para alguém deixá-la mais clara.", "Montar sua apresentação curta."),
    mod("k03", "Sua apresentação em 60 segundos", "Quando alguém pergunta “me fala sobre você”, o que você responde?", {
      title: "Presente, passado, próximo passo",
      what: "Uma boa apresentação curta diz o que você faz ou estuda hoje, o que já fez que é relevante e o que você procura agora.",
      why: "Essa pergunta aparece em entrevistas, eventos e conversas informais. Ter uma base pronta evita respostas longas e confusas.",
      example: "“Estou no último ano de Administração. Nos últimos dois anos cuidei do atendimento na loja da família e organizei o estoque. Agora procuro uma primeira vaga em operações.”",
      mistake: "Contar a vida desde o ensino fundamental ou decorar um texto que soa artificial.",
    }, "Como responder “me fala sobre você”", [
      { type: "fields", key: "k03.pitch", title: "Minha apresentação", fields: [
        { k: "hoje", l: "Hoje eu…" }, { k: "antes", l: "Antes, eu…", multiline: ML }, { k: "procuro", l: "Agora procuro…" },
        { k: "teste", l: "Falei em voz alta e cronometrei. O que vou cortar?", multiline: ML }] },
    ], "Minha apresentação em 60 segundos", "Poste sua apresentação e peça uma sugestão de corte.", "Escolher onde procurar."),
    mod("k04", "Onde procurar, de verdade", "Quais vagas fazem sentido para você agora?", {
      title: "Alvo antes de volume",
      what: "Definir um alvo é escolher tipo de função, nível, região ou formato e alguns tipos de empresa. Você continua aberto, mas sabe por onde começar.",
      why: "Mandar currículo para tudo cansa e gera pouco retorno. Um alvo permite adaptar a candidatura e procurar pessoas certas.",
      example: "“Assistente administrativo ou de operações, presencial ou híbrido na minha cidade, em empresas de médio porte.”",
      mistake: "Desistir de uma vaga só porque você não cumpre 100% dos requisitos listados.",
    }, null, [
      { type: "fields", key: "k04.alvo", title: "Meu alvo", fields: [
        { k: "funcoes", l: "Funções que me interessam" }, { k: "formato", l: "Formato", options: ["Presencial", "Híbrido", "Remoto", "Tanto faz"] },
        { k: "empresas", l: "Tipos de empresa ou setores" }, { k: "canais", l: "Onde vou procurar (sites, pessoas, grupos)", multiline: ML }] },
    ], "Meu alvo de vagas", "Que tipo de vaga você está procurando? Alguém pode conhecer uma.", "Criar uma rotina de busca."),
    mod("k05", "Uma rotina que aguenta semanas", "Como procurar sem desanimar?", {
      title: "Busca é um processo",
      what: "Procurar trabalho funciona melhor com uma rotina pequena e constante: candidaturas adaptadas, conversas com pessoas da área e acompanhamento do que foi enviado.",
      why: "Respostas demoram e muitas não chegam. Medir o que você faz, e não só as respostas, ajuda a manter o ritmo.",
      example: "Por semana: 5 candidaturas adaptadas, 2 mensagens para pessoas da área, 1 hora melhorando o perfil.",
      mistake: "Passar dias sem fazer nada esperando retorno de uma única vaga.",
    }, null, [
      { type: "fields", key: "k05.rotina", title: "Minha rotina semanal", fields: [
        { k: "cand", l: "Candidaturas por semana" }, { k: "pessoas", l: "Conversas com pessoas da área por semana" },
        { k: "quando", l: "Quando vou fazer isso (dias e horários)" }, { k: "revisao", l: "O que vou revisar se em 4 semanas não houver retorno?", multiline: ML }] },
    ], "Minha rotina de busca", "Qual é a sua meta de busca desta semana?", "Revisar seu kit no seu espaço."),
  ],
  finalPlan: { title: "Meu kit profissional", sections: [
    { t: "Experiências", keys: ["k01.inventario"] }, { t: "Provas de competência", keys: ["k02.provas"] },
    { t: "Apresentação", keys: ["k03.pitch"] }, { t: "Alvo", keys: ["k04.alvo"] }, { t: "Rotina", keys: ["k05.rotina"] }] },
};

export const MAPA_CARREIRA: Course = {
  slug: "carreira-nao-emprego",
  title: "Construa uma carreira, não apenas um emprego",
  thesis: "Entenda onde você está, quais competências precisa desenvolver e quais movimentos podem aproximar você de onde quer chegar.",
  category: "Carreira", difficulty: "Fundamentos", commitment: "5 módulos · cerca de 25 min de prática cada",
  project: "Meu mapa de carreira",
  outcomes: ["Meu retrato atual", "Meu mapa de competências", "Minhas direções possíveis", "Minha lacuna prioritária", "Meus próximos 6 meses"],
  tools: ["Mapa de competências", "Comparador de direções"],
  next: [
    { slug: "o-proximo-passo", why: "Transforme o mapa em uma decisão concreta." },
    { slug: "comunicacao-profissional", why: "Ser visto também depende de como você se comunica." },
    { slug: "networking-do-zero", why: "Movimentos de carreira passam por pessoas." },
  ],
  modules: [
    mod("m01", "Onde você está hoje", "Se alguém descrevesse seu trabalho com honestidade, o que diria?", {
      title: "Retrato antes de plano",
      what: "Um retrato atual junta o que você faz, o que gosta, o que drena sua energia e o que o mercado reconhece em você.",
      why: "Planos de carreira falham quando partem de onde a pessoa gostaria de estar, e não de onde ela realmente está.",
      example: "“Faço relatórios e atendo clientes internos. Gosto de resolver problemas, me cansa repetir tarefas manuais. Me pedem ajuda com planilhas.”",
      mistake: "Confundir cargo com competência. O título diz pouco sobre o que você sabe fazer.",
    }, "Como fazer um retrato honesto da sua carreira", [
      { type: "fields", key: "m01.retrato", title: "Meu retrato atual", fields: [
        { k: "faco", l: "O que eu faço na maior parte do tempo", multiline: ML }, { k: "gosto", l: "O que me dá energia" },
        { k: "drena", l: "O que me drena" }, { k: "pedem", l: "No que as pessoas me pedem ajuda" }] },
    ], "Meu retrato atual", "No que as pessoas mais te pedem ajuda no trabalho?", "Mapear competências."),
    mod("m02", "Competências que você tem e as que faltam", "O que você sabe fazer bem, mais ou menos e ainda não sabe?", {
      title: "Técnicas, de relação e de autogestão",
      what: "Competências técnicas são o que você sabe fazer (uma ferramenta, uma análise). De relação, como você trabalha com pessoas. De autogestão, como você se organiza e decide.",
      why: "Crescer raramente é aprender tudo; é identificar uma ou duas lacunas que mais limitam o próximo passo.",
      example: "Analista com boa técnica, mas que trava ao apresentar resultados: a lacuna prioritária é comunicação, não mais um curso técnico.",
      mistake: "Investir sempre no que já é forte porque é confortável.",
    }, null, [
      { type: "groups", key: "m02.competencias", title: "Meu mapa de competências", groups: ["Faço bem", "Faço mais ou menos", "Ainda não sei"], ph: "Ex.: apresentar resultados" },
    ], "Meu mapa de competências", "Qual competência você está tentando desenvolver agora?", "Desenhar direções possíveis."),
    mod("m03", "Mais de uma direção possível", "Para onde sua carreira poderia ir nos próximos anos?", {
      title: "Subir, aprofundar, ampliar ou mudar",
      what: "Há vários movimentos: subir (mais responsabilidade), aprofundar (virar especialista), ampliar (assumir áreas vizinhas) ou mudar (outra área).",
      why: "Pensar em uma única direção cria ansiedade. Comparar duas ou três ajuda a decidir com mais clareza.",
      example: "Uma pessoa de atendimento pode ir para liderança de equipe, para treinamento ou para produto, usando a mesma base de conhecimento do cliente.",
      mistake: "Copiar o caminho de alguém sem saber se a rotina dessa pessoa combina com você.",
    }, "Os movimentos possíveis numa carreira", [
      { type: "fields", key: "m03.direcoes", title: "Minhas direções", fields: [
        { k: "d1", l: "Direção 1: o que é e por que me atrai", multiline: ML }, { k: "d2", l: "Direção 2", multiline: ML },
        { k: "d3", l: "Direção 3 (opcional)", multiline: ML }, { k: "conversar", l: "Com quem posso conversar para entender melhor cada uma?" }] },
    ], "Minhas direções possíveis", "Alguém aqui trabalha numa dessas direções? Pergunte como é a rotina.", "Escolher a lacuna que mais importa."),
    mod("m04", "A lacuna que mais importa", "O que, se você aprendesse, abriria mais portas?", {
      title: "Uma lacuna por vez",
      what: "Compare suas direções com seu mapa de competências e escolha a lacuna que aparece em mais caminhos.",
      why: "Foco gera progresso visível em poucos meses, o que alimenta a confiança para o próximo passo.",
      example: "Se “apresentar dados” aparece em liderança e em produto, é por ela que vale começar.",
      mistake: "Montar uma lista de dez cursos e não terminar nenhum.",
    }, null, [
      { type: "fields", key: "m04.lacuna", title: "Minha lacuna prioritária", fields: [
        { k: "qual", l: "Qual é a lacuna" }, { k: "porque", l: "Por que ela importa para as direções", multiline: ML },
        { k: "como", l: "Como vou praticar no trabalho atual", multiline: ML }, { k: "evidencia", l: "Como vou saber que melhorei?" }] },
    ], "Minha lacuna prioritária", "Como você pratica uma habilidade nova sem mudar de emprego?", "Planejar os próximos seis meses."),
    mod("m05", "Os próximos seis meses", "O que você vai fazer de diferente até lá?", {
      title: "Movimentos pequenos e visíveis",
      what: "Um plano de seis meses tem poucos movimentos: algo para aprender, algo para mostrar e alguém para conhecer.",
      why: "Carreira se constrói tanto pelo que você sabe quanto por quem sabe que você sabe.",
      example: "Aprender análise básica de dados, apresentar um relatório para a equipe no mês 3, conversar com duas pessoas da área de produto.",
      mistake: "Esperar uma promoção acontecer sem que ninguém saiba o que você quer.",
    }, null, [
      { type: "fields", key: "m05.plano", title: "Meus próximos 6 meses", fields: [
        { k: "aprender", l: "O que vou aprender" }, { k: "mostrar", l: "O que vou mostrar e para quem" },
        { k: "conhecer", l: "Quem vou conhecer" }, { k: "conversa", l: "Conversa que preciso ter com minha liderança", multiline: ML }] },
    ], "Meus próximos 6 meses", "Qual é o seu movimento mais importante deste semestre?", "Revisar seu mapa no seu espaço."),
  ],
  finalPlan: { title: "Meu mapa de carreira", sections: [
    { t: "Onde estou", keys: ["m01.retrato"] }, { t: "Competências", keys: ["m02.competencias"] }, { t: "Direções", keys: ["m03.direcoes"] },
    { t: "Lacuna prioritária", keys: ["m04.lacuna"] }, { t: "Próximos 6 meses", keys: ["m05.plano"] }] },
};

export const TRANSICAO: Course = {
  slug: "mudar-de-carreira",
  title: "Quero mudar de carreira. E agora?",
  thesis: "Um processo para explorar uma mudança profissional sem precisar jogar sua trajetória inteira fora.",
  category: "Carreira", difficulty: "Fundamentos", commitment: "5 módulos · cerca de 30 min de prática cada",
  project: "Meu plano de transição",
  outcomes: ["Meus motivos", "Minhas habilidades transferíveis", "Minhas conversas de exploração", "Meu experimento pequeno", "Meu plano de transição"],
  tools: ["Separador de motivos", "Ponte de habilidades", "Roteiro de conversa exploratória"],
  next: [
    { slug: "dinheiro-sem-complicacao", why: "Uma transição fica mais tranquila com o dinheiro organizado." },
    { slug: "linkedin-cv-e-presenca", why: "Reescreva sua história para a nova área." },
    { slug: "networking-do-zero", why: "Quem já está na área é sua melhor fonte." },
  ],
  modules: [
    mod("t01", "Fugir de algo ou ir para algo?", "O que exatamente você quer deixar para trás?", {
      title: "Separar o problema",
      what: "Às vezes o incômodo é com a área; às vezes é com a empresa, a liderança, o salário ou a rotina. Cada um pede uma solução diferente.",
      why: "Mudar de área para resolver um problema de empresa pode custar anos e trazer o mesmo incômodo de volta.",
      example: "Quem odeia o trabalho por causa de um chefe ruim talvez precise de outra empresa, não de outra profissão.",
      mistake: "Decidir no pior dia da semana.",
    }, "Antes de mudar, entenda o que incomoda", [
      { type: "classify", key: "t01.motivos", prompt: "Para cada incômodo, onde ele mora?", categories: ["Área", "Empresa", "Condições"], items: [
        { t: "Não gosto do que faço em nenhum dia", a: "Área" }, { t: "Minha liderança não reconhece meu trabalho", a: "Empresa", why: "Pode mudar trocando de time ou empresa." },
        { t: "Ganho menos do que preciso", a: "Condições", why: "Às vezes se resolve negociando ou mudando de empresa na mesma área." },
        { t: "Não me vejo fazendo isso daqui a 10 anos", a: "Área" }, { t: "A cultura é tóxica", a: "Empresa" }, { t: "O horário não cabe na minha vida", a: "Condições" }] },
      { type: "question", key: "t01.meu", prompt: "No meu caso, o que eu quero deixar para trás e para o que eu quero ir?" },
    ], "Meus motivos", "Você já confundiu um problema de empresa com um problema de área?", "Descobrir o que vai com você."),
    mod("t02", "O que vai com você", "Que partes da sua trajetória servem na nova área?", {
      title: "Habilidades transferíveis",
      what: "São competências que funcionam em vários contextos: organizar, negociar, analisar, ensinar, atender, liderar, escrever.",
      why: "Elas encurtam a transição e tornam sua história mais convincente para quem vai te contratar.",
      example: "Professor que vai para treinamento corporativo leva didática, planejamento de aula e gestão de turma.",
      mistake: "Se apresentar como iniciante absoluto quando você já traz muita coisa.",
    }, null, [
      { type: "fields", key: "t02.ponte", title: "Ponte de habilidades", fields: [
        { k: "destino", l: "Área que estou considerando" }, { k: "levo", l: "O que eu levo comigo", multiline: ML },
        { k: "falta", l: "O que eu ainda precisaria aprender", multiline: ML }, { k: "historia", l: "Como eu explicaria a mudança em duas frases", multiline: ML }] },
    ], "Minhas habilidades transferíveis", "Que habilidade da sua área atual você acha que serviria em outra?", "Conversar com quem já está lá."),
    mod("t03", "Conversas antes de decisões", "Quem pode te contar como a nova área é por dentro?", {
      title: "Conversas de exploração",
      what: "Uma conversa de exploração é um papo curto com alguém da área para entender rotina, entrada e desafios. Não é pedido de emprego.",
      why: "Vídeos e posts mostram a parte bonita. Pessoas contam o que não aparece.",
      example: "“Estou pensando em migrar para UX. Teria 20 minutos para me contar como é sua semana e como você entrou na área?”",
      mistake: "Transformar a conversa em pedido de vaga logo no início.",
    }, "Como pedir e conduzir uma conversa de exploração", [
      { type: "list", key: "t03.conversas", title: "Minhas conversas", max: 5, statusLabel: "Status", statuses: ["Quero falar", "Mensagem enviada", "Conversei"], fields: [
        { k: "quem", l: "Pessoa ou perfil" }, { k: "pergunta", l: "Minha principal pergunta" }, { k: "aprendi", l: "O que aprendi" }] },
    ], "Minhas conversas de exploração", "Alguém aqui trabalha na área que você está considerando? Peça uma conversa.", "Testar antes de pular."),
    mod("t04", "Teste pequeno antes do salto", "Como experimentar a nova área sem largar tudo?", {
      title: "Experimentos de baixo risco",
      what: "Um curso curto, um projeto voluntário, um freelance pequeno, acompanhar alguém por um dia: formas de sentir a área com pouco custo.",
      why: "O experimento mostra se você gosta da rotina real e gera algo para mostrar depois.",
      example: "Quem pensa em marketing faz as redes de um pequeno negócio de um conhecido por um mês.",
      mistake: "Pedir demissão antes de ter testado nada.",
    }, null, [
      { type: "fields", key: "t04.experimento", title: "Meu experimento", fields: [
        { k: "o", l: "O que vou testar", multiline: ML }, { k: "prazo", l: "Prazo" },
        { k: "sinal", l: "O que me diria que vale continuar?" }, { k: "resultado", l: "Depois: o que aprendi", multiline: ML }] },
      { type: "decision", key: "t04.decisao", ask: "Depois do experimento, qual caminho faz mais sentido?", paths: [
        { k: "Continuar", when: "Gostei da rotina e vi sinais de que consigo entrar." }, { k: "Ajustar", when: "Gostei de parte; quero testar uma variação da área." }, { k: "Ficar", when: "Percebi que o problema não era a área." }] },
    ], "Meu experimento pequeno", "Que experimento barato você poderia fazer este mês?", "Montar o plano de transição."),
    mod("t05", "O plano de transição", "Qual é o caminho e o prazo realista?", {
      title: "Ponte, não salto",
      what: "Um plano de transição define etapas, prazo, o que aprender, quem conhecer e quanto de reserva financeira você precisa para atravessar.",
      why: "Transições costumam levar meses. Saber disso evita desistir no meio ou se apertar financeiramente.",
      example: "Meses 1-3 estudando à noite; meses 4-6 com dois projetos para portfólio; a partir do 6, candidaturas com reserva para alguns meses.",
      mistake: "Ignorar que pode haver uma fase com renda menor.",
    }, null, [
      { type: "fields", key: "t05.plano", title: "Meu plano de transição", fields: [
        { k: "etapas", l: "Etapas e prazos", multiline: ML }, { k: "aprender", l: "O que preciso aprender" },
        { k: "pessoas", l: "Pessoas e comunidades" }, { k: "reserva", l: "Do que preciso financeiramente para atravessar", multiline: ML },
        { k: "saida", l: "Qual é meu plano B se demorar mais?" }] },
    ], "Meu plano de transição", "Em que etapa da transição você está?", "Revisar seu plano no seu espaço."),
  ],
  finalPlan: { title: "Meu plano de transição", sections: [
    { t: "Motivos", keys: ["t01.meu"] }, { t: "Habilidades que levo", keys: ["t02.ponte"] }, { t: "Conversas", keys: ["t03.conversas"] },
    { t: "Experimento", keys: ["t04.experimento", "t04.decisao"] }, { t: "Plano", keys: ["t05.plano"] }] },
};

export const PROXIMO_PASSO: Course = {
  slug: "o-proximo-passo",
  title: "O próximo passo",
  thesis: "Para quem não precisa recomeçar, apenas entender qual movimento faz mais sentido agora.",
  category: "Carreira", difficulty: "Fundamentos", commitment: "4 módulos · cerca de 20 min de prática cada",
  project: "Meu próximo passo",
  outcomes: ["Minhas opções", "Meus critérios", "Minha decisão", "Minha primeira semana"],
  tools: ["Matriz de decisão"],
  next: [
    { slug: "carreira-nao-emprego", why: "Coloque esse passo num mapa maior." },
    { slug: "comunicacao-profissional", why: "Muitos próximos passos começam com uma conversa difícil." },
  ],
  modules: [
    mod("p01", "Liste as opções de verdade", "Quais movimentos estão disponíveis para você agora?", {
      title: "Ficar também é opção",
      what: "Liste todas as opções reais: pedir mais responsabilidade, mudar de time, mudar de empresa, estudar algo, negociar condições ou ficar como está por enquanto.",
      why: "Decisões difíceis parecem binárias (“fico ou saio”), quando quase sempre há um caminho do meio.",
      example: "Em vez de pedir demissão, propor assumir um projeto novo por três meses.",
      mistake: "Comparar só duas opções e esquecer as intermediárias.",
    }, null, [{ type: "groups", key: "p01.opcoes", title: "Minhas opções", groups: ["No lugar onde estou", "Fora daqui", "Aprender algo"], ph: "Ex.: pedir para liderar um projeto" }],
    "Minhas opções", "Que opção do meio você descobriu quando parou para listar?", "Definir critérios."),
    mod("p02", "O que importa agora", "Com quais critérios você vai comparar as opções?", {
      title: "Critérios desta fase",
      what: "Critérios mudam com a fase da vida: aprendizado, dinheiro, estabilidade, tempo livre, reconhecimento, proximidade de casa.",
      why: "Sem critérios explícitos, a decisão vai para quem fala mais alto: o medo ou a empolgação.",
      example: "Para quem quer aprender rápido, um time exigente pode valer mais que um aumento pequeno.",
      mistake: "Usar os critérios de outra pessoa.",
    }, null, [{ type: "choices", key: "p02.criterios", prompt: "Escolha até três critérios mais importantes agora.", multi: true, options: ["Aprendizado", "Dinheiro", "Estabilidade", "Tempo livre", "Reconhecimento", "Propósito", "Flexibilidade", "Perto de casa"] }],
    "Meus critérios", "Quais são seus três critérios desta fase?", "Comparar e decidir."),
    mod("p03", "Comparar e decidir", "Qual opção atende melhor seus critérios?", {
      title: "Matriz simples",
      what: "Dê uma nota de 1 a 5 para cada opção em cada critério. A matriz não decide por você, mas mostra o que você está sentindo.",
      why: "Ver lado a lado reduz a sensação de que tudo é igualmente importante.",
      example: "Mudar de time: aprendizado 4, dinheiro 3, estabilidade 5. Mudar de empresa: 5, 4, 2.",
      mistake: "Ajustar as notas até sair a resposta que você já queria. Se acontecer, isso também é uma informação.",
    }, null, [{ type: "fields", key: "p03.decisao", title: "Minha decisão", fields: [
      { k: "matriz", l: "Notas de cada opção por critério", multiline: ML }, { k: "escolha", l: "Opção escolhida" },
      { k: "porque", l: "Por que ela", multiline: ML }, { k: "risco", l: "O maior risco e como vou reduzi-lo" }] }],
    "Minha decisão", "Já usou uma matriz para decidir algo de carreira? Funcionou?", "Planejar a primeira semana."),
    mod("p04", "A primeira semana", "O que você faz já na segunda-feira?", {
      title: "Decisão sem ação vira desejo",
      what: "Transforme a decisão em três ações pequenas para os próximos sete dias.",
      why: "Começar rápido diminui a chance de voltar atrás por insegurança.",
      example: "Marcar conversa com a liderança, atualizar o perfil, mandar mensagem para alguém do time desejado.",
      mistake: "Esperar o momento perfeito.",
    }, null, [{ type: "fields", key: "p04.semana", title: "Minha primeira semana", fields: [
      { k: "a1", l: "Ação 1" }, { k: "a2", l: "Ação 2" }, { k: "a3", l: "Ação 3" }, { k: "revisar", l: "Quando vou revisar se deu certo?" }] }],
    "Minha primeira semana", "Qual é a sua primeira ação desta semana?", "Revisar no seu espaço."),
  ],
  finalPlan: { title: "Meu próximo passo", sections: [
    { t: "Opções", keys: ["p01.opcoes"] }, { t: "Critérios", keys: ["p02.criterios"] }, { t: "Decisão", keys: ["p03.decisao"] }, { t: "Primeira semana", keys: ["p04.semana"] }] },
};

export const ENTREVISTA: Course = {
  slug: "entrevista-sem-resposta-decorada",
  title: "Entrevista sem resposta decorada",
  thesis: "Aprenda a entender o que a empresa está procurando e comunicar melhor o que você pode entregar.",
  category: "Carreira", difficulty: "Iniciante", commitment: "4 módulos · cerca de 25 min de prática cada",
  project: "Minha preparação de entrevista",
  outcomes: ["Minha leitura da vaga", "Minhas histórias", "Minhas respostas difíceis", "Minhas perguntas e follow-up"],
  tools: ["Leitor de vaga", "Banco de histórias", "Simulador de perguntas"],
  next: [{ slug: "chegue-forte-ao-mercado", why: "Organize seu kit para as próximas candidaturas." }, { slug: "comunicacao-profissional", why: "Fale com mais clareza em qualquer conversa." }],
  modules: [
    mod("e01", "Leia a vaga como um problema", "Que problema essa empresa quer resolver contratando alguém?", {
      title: "Toda vaga é um problema",
      what: "Por trás da lista de requisitos há uma necessidade: alguém saiu, o time cresceu, um processo está travando.",
      why: "Quem entende o problema responde mostrando como ajudaria, não só listando o que sabe.",
      example: "“Organizado e com Excel avançado” para assistente financeiro pode significar: os relatórios estão atrasando.",
      mistake: "Ler só o título da vaga e o salário.",
    }, null, [{ type: "fields", key: "e01.vaga", title: "Minha leitura da vaga", fields: [
      { k: "vaga", l: "Vaga e empresa" }, { k: "problema", l: "Que problema parece existir?", multiline: ML },
      { k: "requisitos", l: "Três requisitos mais importantes" }, { k: "eu", l: "Onde eu já resolvi algo parecido", multiline: ML }] }],
    "Minha leitura da vaga", "Cole uma descrição de vaga (sem a empresa) e peça uma segunda leitura.", "Preparar histórias."),
    mod("e02", "Histórias, não frases prontas", "Que situações reais você pode contar?", {
      title: "Banco de histórias",
      what: "Prepare 4 ou 5 histórias reais (situação, o que você fez, resultado, o que aprendeu) que podem responder a várias perguntas.",
      why: "Decorar respostas soa artificial e quebra quando a pergunta muda. Histórias se adaptam.",
      example: "A mesma história de um prazo apertado responde a “trabalho sob pressão”, “organização” e “um desafio que você superou”.",
      mistake: "Contar só histórias em que tudo deu certo. Erros com aprendizado mostram maturidade.",
    }, "Como contar uma boa história de trabalho", [{ type: "list", key: "e02.historias", title: "Meu banco de histórias", max: 5, statusLabel: "Mostra", statuses: ["Organização", "Pessoas", "Problema", "Erro e aprendizado", "Iniciativa"], fields: [
      { k: "situacao", l: "Situação" }, { k: "acao", l: "O que eu fiz" }, { k: "resultado", l: "Resultado e aprendizado" }] }],
    "Minhas histórias", "Qual pergunta de entrevista mais te trava?", "Treinar as perguntas difíceis."),
    mod("e03", "As perguntas difíceis", "Como responder sem fugir e sem se sabotar?", {
      title: "Honestidade com direção",
      what: "Perguntas como “seu maior defeito”, “por que saiu” ou “pretensão salarial” pedem respostas honestas que terminem no que você está fazendo a respeito.",
      why: "O entrevistador quer ver autoconhecimento e maturidade, não perfeição.",
      example: "“Eu tinha dificuldade em delegar. Comecei a dividir tarefas com prazos claros e acompanhar semanalmente.”",
      mistake: "Falar mal da empresa anterior ou dar um “defeito” disfarçado de qualidade.",
    }, null, [{ type: "scenarios", key: "e03.dificeis", title: "Simulador de perguntas", intro: "Escreva como você responderia a cada pergunta.", items: ["Fale sobre você.", "Por que você quer sair (ou saiu) do último trabalho?", "Qual é um ponto que você está desenvolvendo?", "Qual é a sua pretensão salarial?", "Por que deveríamos escolher você?"], framework: ["Responda com honestidade", "Use um exemplo real", "Termine no que você faz a respeito ou no que pode entregar"] }],
    "Minhas respostas difíceis", "Como você responde à pergunta sobre pretensão salarial?", "Fechar bem a entrevista."),
    mod("e04", "Perguntar e fazer follow-up", "O que você pergunta no final e o que faz depois?", {
      title: "A entrevista é uma conversa",
      what: "Suas perguntas mostram interesse e ajudam você a avaliar a empresa. O follow-up educado depois mantém você lembrado.",
      why: "Você também está escolhendo. Saber como é o dia a dia evita aceitar algo que não combina.",
      example: "“Como seria um bom primeiro trimestre nessa função?” e, no dia seguinte, uma mensagem curta agradecendo.",
      mistake: "Dizer “não tenho perguntas”.",
    }, null, [{ type: "fields", key: "e04.perguntas", title: "Minhas perguntas e follow-up", fields: [
      { k: "p", l: "Três perguntas que vou fazer", multiline: ML }, { k: "follow", l: "Minha mensagem de agradecimento", multiline: ML }, { k: "depois", l: "Depois da entrevista: o que fui bem e o que ajustar", multiline: ML }] }],
    "Minhas perguntas e follow-up", "Qual pergunta você já fez a um entrevistador e foi boa?", "Revisar sua preparação no seu espaço."),
  ],
  finalPlan: { title: "Minha preparação de entrevista", sections: [
    { t: "A vaga", keys: ["e01.vaga"] }, { t: "Histórias", keys: ["e02.historias"] }, { t: "Perguntas difíceis", keys: ["e03.dificeis"] }, { t: "Perguntas e follow-up", keys: ["e04.perguntas"] }] },
};

export const PRESENCA: Course = {
  slug: "linkedin-cv-e-presenca",
  title: "LinkedIn, CV e presença profissional",
  thesis: "Organize sua experiência para que outras pessoas entendam rapidamente o que você sabe fazer.",
  category: "Carreira", difficulty: "Iniciante", commitment: "4 módulos · cerca de 25 min de prática cada",
  project: "Meu perfil profissional",
  outcomes: ["Meu posicionamento em uma linha", "Meu currículo reescrito", "Meu perfil revisado", "Meu plano de presença"],
  tools: ["Construtor de título", "Reescritor de experiências"],
  next: [{ slug: "entrevista-sem-resposta-decorada", why: "Prepare-se para quando o perfil gerar conversa." }, { slug: "networking-do-zero", why: "Presença sem relacionamento rende pouco." }],
  modules: [
    mod("l01", "Quem você é em uma linha", "Se alguém visse só seu título, entenderia o que você faz?", {
      title: "Função + especialidade + para quem",
      what: "Um bom título diz o que você faz, em que é bom e para quem ou em que contexto.",
      why: "Recrutadores e pessoas da sua área leem o título em segundos antes de decidir abrir o perfil.",
      example: "“Analista financeiro | Relatórios e controle de custos para pequenas e médias empresas”.",
      mistake: "Usar “Em busca de novas oportunidades” como única informação.",
    }, null, [{ type: "fields", key: "l01.titulo", title: "Meu título", fields: [
      { k: "funcao", l: "Função ou área" }, { k: "especialidade", l: "No que sou bom" }, { k: "contexto", l: "Para quem ou em que contexto" }, { k: "final", l: "Meu título final" }] }],
    "Meu posicionamento em uma linha", "Poste seu título e peça para alguém dizer o que entendeu.", "Reescrever o currículo."),
    mod("l02", "Currículo que se lê em 30 segundos", "O que precisa estar na primeira metade da página?", {
      title: "Resultado antes de tarefa",
      what: "Cada experiência começa por verbos de ação e, quando possível, pelo que mudou com seu trabalho. Uma página costuma bastar para quem está começando.",
      why: "Quem seleciona lê rápido. Tarefas genéricas parecem iguais em todos os currículos.",
      example: "“Responsável pelo atendimento” vira “Atendi cerca de 40 clientes por dia e criei respostas padrão que reduziram reclamações repetidas”.",
      mistake: "Incluir dados pessoais desnecessários ou inventar números.",
    }, null, [
      { type: "compare", before: "Responsável por planilhas e relatórios.", after: "Automatizei o relatório semanal de vendas, que passou a sair na segunda de manhã." },
      { type: "fields", key: "l02.cv", title: "Experiências reescritas", fields: [
        { k: "e1", l: "Experiência 1: antes e depois", multiline: ML }, { k: "e2", l: "Experiência 2: antes e depois", multiline: ML }, { k: "resumo", l: "Resumo de 3 linhas no topo", multiline: ML }] },
    ], "Meu currículo reescrito", "Peça para alguém da área ler uma experiência sua reescrita.", "Revisar o perfil."),
    mod("l03", "O perfil que trabalha por você", "Seu perfil responde às perguntas de quem o abre?", {
      title: "Sobre, experiência e provas",
      what: "O “Sobre” conta em poucas linhas o que você faz e o que procura. Projetos, certificados e posts mostram provas.",
      why: "O perfil é consultado antes de entrevistas e depois de conhecer você em um evento.",
      example: "Um “Sobre” com três parágrafos curtos: o que faço, um exemplo do meu trabalho, o que procuro agora.",
      mistake: "Copiar o currículo inteiro no “Sobre”.",
    }, null, [{ type: "choices", key: "l03.checklist", prompt: "O que seu perfil já tem?", multi: true, options: ["Foto clara e atual", "Título com função e especialidade", "Sobre com o que procuro", "Experiências com resultados", "Um projeto ou trabalho para mostrar", "Localização e formato de trabalho"] },
      { type: "question", key: "l03.sobre", prompt: "Escreva seu novo “Sobre” em até três parágrafos curtos." }],
    "Meu perfil revisado", "Compartilhe seu “Sobre” e peça uma sugestão.", "Criar presença sem virar influenciador."),
    mod("l04", "Presença sem virar influenciador", "Como ser lembrado sem postar todo dia?", {
      title: "Contribuir, não performar",
      what: "Presença profissional pode ser comentar com qualidade, compartilhar algo que aprendeu ou mostrar um projeto de vez em quando.",
      why: "Pessoas lembram de quem ajuda e de quem mostra trabalho real.",
      example: "Um post por mês contando algo que você aprendeu num projeto, com o que funcionou e o que não funcionou.",
      mistake: "Copiar o tom de posts motivacionais que não têm a ver com você.",
    }, null, [{ type: "fields", key: "l04.presenca", title: "Meu plano de presença", fields: [
      { k: "temas", l: "Dois ou três temas sobre os quais posso falar" }, { k: "ritmo", l: "Ritmo realista", options: ["Um post por mês", "A cada duas semanas", "Toda semana", "Só comentar por enquanto"] },
      { k: "primeiro", l: "Ideia do meu primeiro post", multiline: ML }] }],
    "Meu plano de presença", "Sobre o que você poderia escrever com propriedade?", "Revisar seu perfil no seu espaço."),
  ],
  finalPlan: { title: "Meu perfil profissional", sections: [
    { t: "Título", keys: ["l01.titulo"] }, { t: "Currículo", keys: ["l02.cv"] }, { t: "Perfil", keys: ["l03.checklist", "l03.sobre"] }, { t: "Presença", keys: ["l04.presenca"] }] },
};
