# Revisão pontual da navegação — auditoria e plano

## 1. Mapa atual

Páginas públicas (cabeçalho do site): início, Trilhas, Ferramentas, Cursos (`/cursos`, `/cursos/$slug`), Conheça a comunidade, Conheça os encontros, Oportunidades, Gestores, Sobre, legais, Entrar/recuperar senha, retorno de pagamento.

Área do aluno (menu lateral; exige login): Início, Meu Ângulo, Meus cursos, Comunidade, Encontros, Pessoas, Perfil, Missões, Mensagens, Notificações, aulas, checkout, Administração.

## 2. Pontos confusos encontrados

1. **"Cursos" no menu do aluno tira a pessoa da área do aluno.** O link abre o catálogo público, com o cabeçalho do site e sem o menu lateral. É a principal causa da sensação de "ambientes diferentes".
2. **Botões de cadastro aparecem para quem já está logado:**
   - Início: "Criar conta" no bloco final.
   - Conheça a comunidade: "Conhecer pessoas assim →" vai para o cadastro.
   - Conheça os encontros: "Criar conta" no exemplo interativo.
3. **Login sem retorno ao ponto de origem:** "Entrar para recomendar" (Trilhas) e "Criar conta e experimentar" (página do curso) mandam para o login sem guardar a página, então a pessoa cai no Início do aluno.
4. **Entrar/Fazer parte no cabeçalho público** não guardam a página atual (baixo impacto; o padrão "Início do aluno" é aceitável).
5. Faltam sinais visuais claros de onde a pessoa está: no cabeçalho público, um usuário logado vê só "Minha área" (correto, nada a mudar).

## 3. Correções propostas (baixo risco)

1. Na área do aluno, o catálogo de cursos passa a abrir **dentro do menu lateral**: o link "Cursos" do menu do aluno leva a uma página do catálogo dentro da área do aluno, que reaproveita a mesma lista existente (Meus cursos / Outros cursos). O catálogo público `/cursos` continua igual para visitantes. Clicar num curso continua levando à página do curso existente.
2. Botões de cadastro sensíveis ao login:
   - Início: logado vê "Ir para minha área" no lugar de "Criar conta".
   - Comunidade pública: logado vai para Pessoas.
   - Encontros públicos: logado vê "Ver encontros" (área do aluno).
3. Retorno após login: "Entrar para recomendar" e "Criar conta e experimentar" passam a guardar a página atual; "Entrar" no cabeçalho público também guarda a página (exceto na página inicial).

## 4. O que não muda

Banco, permissões, pagamento, checkout, matrícula, administração, rotas existentes e visual. Nenhuma página é removida.

## 5. Riscos

- Item 1 é o único com página nova; se preferir zero páginas novas, alternativa: manter o link para `/cursos` e só renomear para "Catálogo" com ícone de saída. Menos consistente.
- Itens 2 e 3 só trocam destino de links.

## Detalhes técnicos

- Nova rota `src/routes/_authenticated/catalogo.tsx` extraindo a lista de `cursos.index.tsx` para um componente compartilhado; `AppShell` NAV `/cursos` → `/catalogo`.
- `index.tsx`, `conheca-a-comunidade.tsx`, `conheca-os-encontros.tsx`: condicional `useAuth().user`.
- `TrilhaRecommender.tsx`, `EngineCoursePublic.tsx`, `PublicLayout.tsx`: `search={{ redirect: location.pathname }}` (validado já em `auth.tsx`).
