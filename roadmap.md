# Outro Ângulo — Roadmap

## Check-up da primeira campanha — 23/10/2026
- [x] Auditar 27 páginas no celular e computador; sem imagens quebradas ou erros de execução, corrigido corte dos botões de vídeos
- [x] Corrigir estados de erro/repetição em perfil, cursos, editor, pessoas, mensagens, acesso e assistente; perfil recuperou após falha simulada
- [x] Confirmar 26 usuários com dados de confirmação e matrículas; impedir que falha de consulta pareça ausência de matrícula
- [x] Revalidar 89 testes e preview sem erros após correções de UX
- [x] Administradores consultam 26 contas reais, mais recentes primeiro, confirmação de e-mail, último login e matrículas; busca/atualização verificadas no celular
- [x] Conferir campanha no celular e computador; visitante chegou ao Stripe por R$127 e voltou com CTA disponível
- [x] Conferir login com origem preservada e seis módulos com player na conta autenticada; retomada autenticada coberta por testes
- [x] E-mails habilitados/domínio verificado e quatro eventos de envio; nove compras pagas com matrícula ativa
- [x] Corrigir UX: CTA maior, erros seguros em português, recuperação com saída, novas tentativas de consulta, origem no retorno e metadados completos
- [x] Executar 89 regressões; preview sem erros
- [x] Solicitar publicação das melhorias em 23/10; revisão básica sem achados, conclusão da publicação ainda não confirmada
- [ ] Concluir compra sem conta com e-mail novo e conferir convite recebido + senha + acesso — autorizado; falta e-mail novo controlado pelo usuário e pagamento de R$127

## Retomada do Stripe — 23/10/2026
- [x] Confirmar e corrigir bloqueio após abandonar pagamento aberto, preservando a sessão existente
- [x] Executar 46 regressões, incluindo handlers de retomada e bloqueio de pagamento assíncrono; montagem sem erros
- [ ] Verificar abandono/retomada real no Stripe — conta conectada já possui matrícula; nenhuma cobrança criada

## Teste do gateway — 19/10/2026
- [x] Confirmar conexão autenticada com Mercado Pago e disponibilidade de Pix/cartão, sem cobrar
- [x] Consultar pagamentos recentes e confirmar preço de R$127; executar 42 testes de pagamento
- [ ] Concluir nova compra pelo formulário com conta sem matrícula — conta disponível já possui o curso; nenhuma cobrança criada

## Revisão de segurança — 19/10/2026
- [x] Verificar dependências, permissões do banco e acessos sem login
- [x] Revisar pagamentos, autorização e limites de IA; corrigir falhas confirmadas
- [x] Executar testes e registrar limites da verificação, sem publicar
- [ ] Verificar formulário e pagamento real com conta sem matrícula — conta disponível já possui o curso
- [ ] Confirmar IP confiável no serviço publicado e custo real da IA — depende de evidência do serviço externo

## Revisão final e publicação
- [x] Revisar páginas públicas, de aluno e administração; computador e celular
- [x] Corrigir a montagem dos testes de navegação no ambiente de testes
- [x] Criar categoria Corretores no catálogo e retirar cursos de corretagem de Profissões
- [x] Validar 39 testes e preparar publicação autorizada

## E-mails de autenticação
- [x] Modelos e remetente personalizados; domínio de envio vinculado
- [x] Configuração completa, e-mails habilitados e domínio verificado; quatro eventos de envio confirmados em 23/10
- [ ] Verificar recebimento do convite após compra de visitante novo — depende de compra real; evento enviado não comprova caixa de entrada

## Feito (etapa 1–3)
- [x] Design system, logo, navegação pública e autenticada (lateral desktop / inferior mobile)
- [x] Login, cadastro, Google, recuperação de senha
- [x] Papéis (admin/moderador/membro) em tabela separada, RLS
- [x] Cursos → módulos → aulas, rascunho/publicado/arquivado, reordenação
- [x] Matrículas manuais, revogação; aluno sem matrícula bloqueado no banco
- [x] Player (YouTube/Vimeo validados), progresso, desfazer, última aula, anotações e exercício com autosave
- [x] Painel do aluno, perfil com foto, métricas reais, avisos, lista de interesse, configurações institucionais
- [x] 6 cursos em rascunho + módulos sugeridos

## Próximas etapas
- [ ] Comunidade: canais, chat em tempo real, threads, reações, fixar, busca, não lidas, denúncias, silenciar, anti-spam
- [ ] Turmas com canais privados; moderação (fila, suspensão, log)
- [ ] Diretório de membros com filtros
- [ ] Comentários nas aulas
- [ ] Agenda (eventos, presença, .ics), materiais com download privado
- [ ] Notificações internas e preferências; solicitação de exclusão de conta
- [ ] Pagamentos (aguarda escolha do provedor e dados do vendedor)
- [ ] Testes com contas de diferentes papéis; revisão mobile/acessibilidade

## Fase 2 — experiência logada (feito)
- [x] Navegação nova, onboarding, feed, pessoas, mensagens, encontros, gestores, notificações, ações práticas
- [x] Admin: encontros, gestores, moderação, dados de demonstração removíveis
- [ ] Verificação ponta a ponta com conta real (aguarda primeiro administrador)

## Rebalanceamento além do empreendedorismo
- [x] Pergunta "O que você quer mudar agora?" + caminho "Ainda não sei"
- [x] /cursos por área ("O que você quer melhorar?") + 8 cursos de carreira/comunicação/dinheiro em preparação
- [x] Sobre: "Ninguém precisa aprender tudo…"
- [x] Conteúdo dos novos cursos (carreira, comunicação, dinheiro) no motor de aprendizado
- [ ] Ampliar exemplos de Networking do zero e IA no trabalho
- [ ] Ferramentas de carreira: mapa de carreira, mapa de competências, plano 90 dias, preparador de entrevista, transição
- [ ] Perfil: "Hoje eu…", quero evoluir em, posso ajudar com, quero conhecer pessoas de, próximo passo
- [ ] Comunidade: categorias amplas; Oportunidades: empregos, estágios, freelance, mentoria, eventos
- [ ] Revisão de tom (homepage, trilhas, ferramentas, onboarding) e imagens

## Fase de diferenciação (documento PHASE_DIFFERENTIATION)
- [x] Fase 1 Meu Ângulo (Agora, Próximo, Plano, Evidências)
- [x] Fase 2 Missões (10 missões, registro e reflexão)
- [x] Fase 3 Me dê outro ângulo (simples, sem salvar)
- [ ] Fase 4 Perfil "Preciso de alguém que… / Posso ajudar com…" e conexão básica
- [ ] Fase 5 Contribuições e reputação por utilidade
- [ ] Fase 6 Assistente usando Meu Ângulo, missões e recursos
- [ ] Missões dentro dos cursos; fim de curso com "próximo passo"; painel inicial mais pessoal

## Kit de identidade visual — 23/10/2026
- [x] Logotipos em PNG (transparente, branco) e SVG no tamanho para redes sociais
- [x] Foto de perfil 1024 e capas YouTube/Facebook/LinkedIn/X
- [x] Guia de identidade visual em PDF — montagem e conferência visual (6 páginas, conferidas)
- [ ] Decisão da tela de login: renomear projeto vs. Google próprio — aguarda escolha do usuário

## Migração Stripe (em andamento)
- [ ] Check pré-migração: conta Stripe, chaves, testes, build
- [ ] Integrar checkout Stripe (cartão + Pix + boleto) com webhook assinado
- [ ] Testar antes de tirar o Mercado Pago

## Campanhas
- [x] Página de venda /corretor-na-pratica com origem da campanha
- [x] Compra sem conta + link por e-mail para criar conta com curso liberado

## Conferências solicitadas — 23/10/2026
- [x] Conferir que o link da campanha funciona (página, preço e Stripe)
- [x] Doc de logos separadas para o gestor de marketing
- [x] Conferir envio do e-mail de login (magic link)
- [x] Conferir acesso ao curso para quem já pagou

## Pixel Meta — 23/10/2026
- [ ] Instalar pixel do Meta no site para as campanhas — aguardando ID do pixel do usuário
- [ ] Definir rota de consentimento (banner regional ou bloqueio) antes do rastreio

## Relatórios admin — 23/10/2026
- [x] Aba Relatórios com período, leitura por IA e envio para o próprio e-mail
