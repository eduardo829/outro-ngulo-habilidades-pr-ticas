# Revisão de segurança — 19/10/2026

## Corrigido
- Destinatários podem atualizar somente `messages.read_at`, não o conteúdo de mensagens recebidas. Permissões verificadas no banco em uso.
- Resultados antigos de pagamentos não podem liberar uma nova tentativa em andamento. O servidor envia o identificador da tentativa nos metadados do Mercado Pago; a reconciliação valida esse vínculo.
- Reembolso é terminal para a compra: aprovação atrasada não reativa matrícula. Nova compra é necessária para recomprar.
- Liberação exige aprovação, valor e moeda esperados; valor continua vindo do banco.
- Reserva do gasto estimado da IA usa bloqueio global e verifica o custo da próxima chamada; limite por minuto também considera IP.
- Histórico do assistente aceita somente mensagens de texto e papéis de usuário/assistente, com limites de tamanho por mensagem, contexto e pedido. Todas as chamadas limitam tokens de saída.

## Evidência
- 51 testes passaram, incluindo execução da migration real em PostgreSQL isolado para permissões, tentativas antigas, compatibilidade, reembolso e orçamento.
- Nenhuma vulnerabilidade conhecida nas 70 dependências de produção.
- Scan básico do banco sem problemas; não substitui análise profunda. Resultados profundos persistidos são antigos (13/10), não representam uma nova certificação.
- Visitante em `/catalogo` redirecionado para login; webhook sem assinatura retorna 401.
- Reenvio de pedido válido para função protegida sem token retorna erro serializado `Unauthorized` (envelope HTTP 200), não dados privados.
- Conta administrativa autenticada abre alunos/matrículas; checkout mostra acesso existente sem cobrança.
- Funções de aplicação de pagamento e consumo de IA não são executáveis por visitantes/membros.

## Limites e pendências
- Nenhuma cobrança real foi criada nesta revisão. Formulário de pagamento e conclusão de nova compra não foram verificados com conta sem matrícula.
- Os custos registrados são estimativas por mensagem, não um teto financeiro exato do provedor. Limites de tokens reduzem exposição, mas não reconciliam cobrança efetiva.
- A confiança nos cabeçalhos de IP requer confirmação na entrada do serviço publicado; não foi demonstrada possibilidade de falsificação.
- Alertas do linter sobre funções SECURITY DEFINER exigem interpretação: helpers públicos retornam booleanos/títulos, funções de membro verificam identidade internamente, e funções privilegiadas de pagamento/IA têm execução restrita. Duas tabelas de contadores sem policies são intencionalmente inacessíveis ao usuário.
- Não houve republicação; mudanças no banco já se aplicam, mudanças de código precisam ser publicadas.