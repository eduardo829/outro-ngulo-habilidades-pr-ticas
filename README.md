# Outro Ângulo: Habilidades Práticas

Construa uma plataforma educacional completa e responsiva chamada OUTRO ÂNGULO, voltada ao público brasileiro.

Quero uma aplicação funcional, com autenticação, banco de dados, área de membros, cursos em vídeo, comunidade com chat e painel administrativo. Não entregue apenas uma landing page ou telas com botões sem função.

Implemente em etapas, validando cada fluxo. Quando uma integração exigir uma conta ou credencial minha, deixe a estrutura pronta e explique exatamente o que falta. Não simule uma integração concluída.

## 1. Conceito e posicionamento

Outro Ângulo ensina habilidades práticas para a vida adulta que normalmente ficam fora da educação tradicional:

- O que vale aprender antes dos 25 anos.
- Como construir networking do zero.
- Como se apresentar e comunicar seu valor.
- Como montar um planejamento que funciona.
- Como negociar e lidar com conversas difíceis.
- Como avaliar oportunidades e tomar decisões.
- Como começar a empreender e testar ideias.
- Como aplicar tecnologia e IA no trabalho e na organização pessoal.

O público inicial são jovens adultos brasileiros. A marca deve continuar acolhedora para pessoas acima dos 25 anos.

Assinatura:
“Habilidades para a vida que não veio com manual.”

A proposta é aprender, aplicar e trocar experiências. Cada módulo deve permitir uma atividade concreta.

Evite linguagem de guru, enriquecimento rápido, segredos das elites ou promessas de transformação garantida. Use português brasileiro claro e natural.

## 2. Direção visual

Crie uma identidade contemporânea, inteligente e humana, com qualidade de produto digital.

Paleta inicial:
- Grafite profundo: #151922.
- Branco suave: #F7F8FA.
- Azul cobalto: #4056F4.
- Verde suave: #C9F27B, usado pontualmente.
- Cinza para textos secundários, respeitando contraste e legibilidade.

Use títulos com personalidade e textos fáceis de ler, com fontes como Manrope e Inter, se disponíveis.

Conceito visual: mudança de perspectiva. Explore enquadramentos, recortes e formas deslocadas em detalhes da identidade, sem prejudicar a leitura.

Crie um logotipo tipográfico provisório para “Outro Ângulo”. Ele deve funcionar em desktop, mobile e avatar.

Evite:
- Preto com dourado.
- Gradientes roxos genéricos.
- Emojis como ícones principais.
- Imagens de luxo e dinheiro.
- Excesso de efeitos, cartões e animações.

A área do aluno deve priorizar foco e navegação simples. Use fundo claro para leitura e uma região escura ao redor do player.

## 3. Estrutura de páginas

Área pública:
- Página inicial.
- Catálogo de cursos publicados.
- Página de detalhes de cada curso.
- Página sobre o projeto.
- Login, cadastro e recuperação de senha.
- Páginas de privacidade, termos e diretrizes da comunidade.

Área autenticada:
- Meu início.
- Meus cursos.
- Página do curso com módulos.
- Página da aula.
- Comunidade.
- Membros.
- Agenda.
- Materiais.
- Notificações.
- Meu perfil e configurações.

Área administrativa:
- Visão geral.
- Cursos, módulos e aulas.
- Alunos, matrículas e turmas.
- Comunidade e denúncias.
- Agenda e materiais.
- Configurações da plataforma e integrações.

No desktop, use navegação lateral na área autenticada. No mobile, use navegação inferior para Início, Cursos, Comunidade e Perfil, com acesso simples às demais seções.

## 4. Página pública

Apresente a proposta com clareza.

Sugestão de abertura:
“Tem coisa que muda sua vida. E nunca entrou na grade.”

Complemento:
“Aprenda a construir relações, fazer planos que saem do papel e reconhecer oportunidades — com aulas práticas, experiências reais e uma comunidade para trocar e aplicar.”

Inclua:
- Temas de aprendizado.
- Como funciona a experiência.
- Cursos publicados.
- Apresentação dos fundadores.
- Perguntas frequentes.
- Chamadas para conhecer os cursos ou criar uma conta.

Não invente depoimentos, número de alunos, parceiros, certificações ou resultados.

Os fundadores são Eduardo e Vinícius. Deixe fotos e biografias editáveis, sem inventar credenciais ou detalhes adicionais.

Não crie escassez artificial nem contadores falsos.

## 5. Autenticação e permissões

Use o backend nativo disponível no projeto ou Supabase, conforme a integração suportada. Priorize persistência real, autenticação segura e autorização no servidor.

Papéis:
- Visitante.
- Membro/aluno.
- Moderador.
- Administrador.

Separe conta de acesso ao conteúdo: cadastrar uma conta não deve liberar automaticamente todos os cursos ou a comunidade privada.

Implemente matrículas por curso e permissões explícitas para a comunidade e canais de turmas.

Regras:
- Alunos acessam somente cursos nos quais possuem matrícula ativa e eventuais aulas públicas de apresentação.
- Membros veem somente canais aos quais têm acesso.
- Moderadores gerenciam a comunidade, sem receber automaticamente acesso à administração financeira ou de cursos.
- Administradores gerenciam conteúdo e acessos.
- Um usuário não pode alterar seu próprio papel ou conceder matrícula para si.
- O primeiro administrador deve ser definido por um procedimento seguro, nunca pelo simples fato de ser o primeiro cadastro.

Proteja banco de dados, arquivos privados e operações administrativas com regras no servidor, incluindo RLS quando aplicável. Não dependa apenas de esconder botões.

## 6. Painel inicial do aluno

Inclua:
- Saudação pelo primeiro nome.
- Botão “Continuar aprendendo”.
- Última aula acessada.
- Cursos matriculados e progresso.
- Próximo encontro.
- Avisos da equipe.
- Atividade prática em destaque.

Use estados vazios úteis para contas novas. Não apresente métricas fictícias.

## 7. Cursos e vídeos

Estrutura:
Curso → módulos → aulas.

Cada curso deve ter:
- Título, descrição e capa.
- Instrutor.
- Objetivos de aprendizado.
- Nível e duração, quando informados.
- Status rascunho ou publicado.
- Módulos ordenáveis.
- Política de acesso editável.
- Visibilidade pública ou privada.

Cada aula deve permitir:
- Título e resumo.
- Vídeo.
- Texto complementar.
- Duração informada.
- Materiais para download.
- Exercício prático.
- Comentários.
- Status rascunho/publicado.
- Marcação opcional como aula de apresentação.

Página da aula:
- Player responsivo.
- Lista de módulos e aulas com indicação de progresso.
- Botões de aula anterior e próxima.
- Botão “Marcar como concluída”.
- Materiais e exercício.
- Comentários e respostas.
- Anotações privadas do aluno, com salvamento automático.

Salve progresso individual no banco. Calcule o percentual com base nas aulas concluídas e permita desfazer uma conclusão.

Retome a posição do vídeo quando o provedor suportar essa integração. Quando não suportar, preserve pelo menos a última aula acessada. Não indique que o vídeo foi concluído apenas porque a página foi aberta.

Para vídeos:
- Permita configurar links ou identificadores de provedores de vídeo compatíveis.
- Valide os provedores aceitos; não aceite HTML arbitrário inserido pelo usuário.
- Não construa streaming, transcodificação ou armazenamento de vídeos grandes nesta versão.
- Mostre um estado bem desenhado quando não houver vídeo.
- Não apresente vídeos públicos ou não listados como se tivessem proteção contra compartilhamento.
- Estruture a integração para futura hospedagem com controle de acesso.

## 8. Comunidade com chat

Construa chat persistente e em tempo real para membros autorizados.

Canais iniciais:
- Comece aqui.
- Apresentações.
- Networking.
- Planejamento e execução.
- Carreira e oportunidades.
- Negócios e vendas.
- Tecnologia e IA.
- Dúvidas das aulas.
- Avisos da equipe.

No canal de avisos, apenas administradores e moderadores podem publicar.

Funcionalidades:
- Enviar mensagens.
- Responder em threads.
- Reagir às mensagens.
- Editar e excluir a própria mensagem.
- Mostrar indicação de mensagem editada.
- Fixar mensagens por moderadores.
- Buscar mensagens nos canais autorizados.
- Paginação do histórico.
- Indicador de mensagens não lidas.
- Denunciar mensagens.
- Silenciar notificações por canal.
- Estados de envio, erro e tentativa novamente.

Se houver anexos, limite tamanho e tipos de arquivo, valide no servidor e use armazenamento com controle de acesso.

Implemente proteção contra spam e envio repetido. Renderize texto de forma segura, sem executar HTML ou scripts de mensagens.

Moderação:
- Fila de denúncias.
- Remoção de conteúdo.
- Suspensão de participação.
- Registro de ações administrativas.
- Diretrizes da comunidade.

Não crie conversas ou membros fictícios no ambiente de produção.

Mensagens privadas, chamadas de vídeo e áudio ficam fora da primeira versão.

## 9. Perfis e networking

Perfil com:
- Foto.
- Nome de exibição.
- Bio curta.
- Cidade opcional.
- Área de atuação.
- Interesses.
- “O que posso compartilhar”.
- “O que quero aprender”.
- LinkedIn ou outro link profissional opcional.

Crie diretório de membros com busca e filtros por interesses e área.

A participação no diretório deve ser opcional. E-mails, dados de pagamento e demais informações privadas não podem aparecer no diretório nem ser acessíveis por consultas comuns de outros membros.

Não solicite endereço residencial, data de nascimento ou outros dados desnecessários.

## 10. Agenda e encontros

Administradores podem criar:
- Aula ao vivo.
- Encontro de networking.
- Plantão de dúvidas.
- Workshop.

Campos:
- Título, descrição, data, horário, fuso e duração.
- Responsável.
- Curso ou turma vinculada, quando aplicável.
- Link externo do encontro.
- Link da gravação, quando disponível.

Permita confirmar presença e adicionar ao calendário.

Guarde datas de modo consistente e apresente horários com fuso explícito. Os links dos encontros privados devem estar restritos aos membros autorizados.

Use serviços externos para os encontros. Não construa videoconferência própria.

## 11. Materiais e atividades

Biblioteca com materiais vinculados aos respectivos cursos:
- PDFs.
- Planilhas.
- Checklists.
- Roteiros.
- Templates de planejamento.
- Exercícios.

Permita filtro por tema e curso. Os downloads privados devem respeitar a matrícula e as regras de acesso.

Para atividades, permita uma resposta de texto privada e status de conclusão. Não adicione uma plataforma complexa de correção nesta versão.

## 12. Administração

O administrador deve conseguir, sem editar código:
- Criar, editar, publicar e arquivar cursos.
- Criar e reordenar módulos e aulas.
- Inserir vídeos e materiais.
- Editar textos e capas.
- Gerenciar matrículas e acessos.
- Criar turmas e seus canais privados.
- Criar eventos.
- Moderar comentários e chat.
- Editar conteúdo institucional e configurações principais.

Use confirmação para ações destrutivas. Prefira arquivar cursos que já possuem alunos, preservando histórico.

Métricas iniciais, sempre baseadas em dados reais:
- Alunos matriculados.
- Alunos que iniciaram um curso.
- Progresso e conclusões.
- Participação na comunidade.
- Inscrições em encontros.

Defina claramente o que cada métrica conta. Não crie gráficos de exemplo misturados aos dados reais.

## 13. Pagamentos e acesso

Prepare a estrutura para uma oferta inicial de R$99, como pagamento único, editável. Não presuma assinatura, renovação automática ou acesso vitalício.

Separe produto, pedido, matrícula e acesso à comunidade para permitir evolução do modelo.

Se a integração de pagamentos ainda não estiver configurada:
- Não mostre checkout funcional fictício.
- Permita matrícula manual pelo administrador.
- Mostre uma alternativa real de lista de interesse.
- Informe quais dados são necessários para ativar o pagamento.

Ao integrar um provedor, libere acesso somente após confirmação autenticada no servidor. Não confie no redirecionamento de sucesso do navegador.

Valide webhooks, trate eventos repetidos sem duplicar matrículas e preveja reembolso e revogação de acesso conforme a política configurada.

Credenciais privadas ficam exclusivamente no servidor.

## 14. Conteúdo inicial editável

Crie apenas a estrutura em rascunho dos cursos abaixo, claramente marcada como conteúdo em preparação:

1. O que ninguém te explicou antes dos 25.
2. Networking do zero.
3. Planejamento que sai do papel.
4. Comunicação e posicionamento.
5. Negociação e oportunidades.
6. IA aplicada à vida e ao trabalho.

Sugestões de módulos para Networking do zero:
- O que networking realmente significa.
- Como mapear relações e ambientes.
- Como iniciar uma conversa.
- Como contribuir antes de pedir.
- Como manter contato.
- Plano prático de relacionamento.

Sugestões de módulos para Planejamento que sai do papel:
- Escolher uma prioridade.
- Transformar objetivos em ações.
- Montar um plano de 90 dias.
- Organizar uma semana possível.
- Revisar o progresso.
- Ajustar quando o plano falha.

Não invente aulas gravadas, duração, datas de lançamento ou promessas de resultado. Cursos em rascunho não devem aparecer como disponíveis para compra.

## 15. Notificações, privacidade e acessibilidade

Crie notificações internas para:
- Respostas recebidas.
- Avisos relevantes.
- Novas aulas publicadas em cursos matriculados.
- Alterações em eventos acompanhados.

Permita marcar como lidas e ajustar preferências. E-mail fica condicionado a um serviço configurado; não simule envios.

Inclua:
- Navegação por teclado.
- Foco visível.
- Contraste adequado.
- Rótulos em formulários.
- Suporte a legendas quando o vídeo/provedor disponibilizar.
- Estados de carregamento, vazio, erro e sucesso.
- Solicitação de exclusão de conta e canal de suporte configurável.

Não declare conformidade legal garantida. Páginas jurídicas devem permanecer como rascunhos identificados até receberem os textos aprovados.

## 16. Implementação e verificação

Organize o trabalho nesta ordem:
1. Design system, navegação, autenticação e permissões.
2. Banco de dados e gestão de cursos.
3. Área do aluno, player e progresso.
4. Comunidade, perfis e moderação.
5. Agenda, materiais e notificações.
6. Matrículas, estrutura comercial e integrações.
7. Revisão mobile, acessibilidade e testes dos fluxos principais.

Use dados de demonstração apenas em ambiente separado e explicitamente identificado.

Verifique, com contas de teste de diferentes papéis:
- Cadastro, login e recuperação.
- Persistência do progresso após recarregar.
- Aluno sem matrícula impedido de acessar conteúdo privado, inclusive por URL e requisição direta.
- Isolamento das anotações privadas.
- Chat funcionando entre dois membros autorizados.
- Canal privado inacessível a quem não pertence à turma.
- Publicação de conteúdo funcionando.
- Usuário comum impedido de executar ações administrativas.
- Revogação de acesso aplicada também aos dados e materiais.
- Navegação e formulários funcionando no mobile.

Ao terminar, apresente:
- O que está funcional e foi verificado.
- O que depende de configuração externa.
- Como definir o administrador inicial.
- Como adicionar o primeiro curso, vídeo e aluno.
- Quais integrações e custos externos precisam ser avaliados.

Comece a implementar. Tome decisões razoáveis para detalhes reversíveis e só interrompa se faltar uma informação indispensável. Quero uma primeira versão utilizável, com espaço para crescer, sem funções fictícias.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/64ad04ea-6636-4edc-aab5-5a247d632aad).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
