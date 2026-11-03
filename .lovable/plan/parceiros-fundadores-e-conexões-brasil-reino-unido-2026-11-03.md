# Parceiros Fundadores e Conexões Brasil–Reino Unido

## O que verifiquei nos três sites
- **araujoeduardo.com**: Eduardo Araújo, empreendedor em Londres, cerca de 15 anos em pisos, reformas e construção. Trabalha com operações, crescimento comercial e parcerias. Site em PT, EN e IT.
- **theflooringempire.co.uk**: pisos de madeira e LVT, com fornecimento e instalação no Reino Unido. Tem logo oficial (horizontal, dourada).
- **refurbishmenthub.co.uk** (RefurbHub): reformas completas em Londres, do projeto ao acabamento, com um gerente de projeto. Tem logo oficial.

Vou usar só o que está nesses sites: nada de números de clientes, faturamento ou avaliações. Os "~15 anos" aparecem só no perfil do Eduardo, porque é o que o próprio site dele diz.

## O que muda para o visitante
1. **Nova seção na página inicial**, "Experiência real. Conexões internacionais.". Mostra os três parceiros com logo, "Londres, Reino Unido", especialidade, uma frase de descrição e os botões "Conhecer" (abre o site da empresa) e "Propor parceria". Cada cartão diz claramente a ligação com o fundador, por exemplo "Empresa do fundador".
2. **Nova página /parceiros**, com:
   - os parceiros fundadores;
   - os especialistas verificados que já existem (os mesmos dados de /especialistas, sem copiar nada);
   - o bloco "Conectando experiências e oportunidades entre Brasil e Reino Unido", com interesses futuros e o aviso de que não há promessa de trabalho, imigração, contratos ou investidores.
   - Filtros por área, país e tipo de parceria. Eles aparecem quando houver mais de um valor para escolher.
3. **Selos diferentes**: "Parceiro fundador", "Parceiro externo", "Especialista verificado" e "Membro da comunidade". Uma linha explica que "Parceiro fundador" significa que a empresa participa da formação do ecossistema, e não que passou por avaliação independente.
4. **Formulário "Propor parceria"**, aberto a visitantes e membros:
   - Campos: nome, e-mail, empresa, país, área, tipo de interesse (os 7 do documento), proposta, site ou LinkedIn e consentimento.
   - Quando é aberto a partir de um cartão, já vem com o parceiro escolhido.
5. **Área de membros**: os mesmos perfis aparecem no diretório de Especialistas, numa aba "Empresas parceiras". Os dados ficam num lugar só.

## Painel administrativo
- Nova aba **"Parceiros"** com dois blocos:
  - **Cadastro de parceiros**: criar, editar, publicar ou ocultar, e escolher o selo. Futuras empresas brasileiras ou internacionais entram por aqui, sem programação.
  - **Propostas recebidas**: lista com status (Novo, Em análise, Contatado, Qualificado, Convertido, Encerrado), origem, parceiro de destino e anotações. Cada mudança fica registrada no histórico de ações que já existe.
- Números simples: visitas a /parceiros, cliques nos sites dos parceiros, propostas por status e se vieram de visitante ou de membro.

## Proteção
- Só administradores leem as propostas. Ninguém de fora vê e-mails ou textos.
- Contra spam:
  - campo invisível anti-robô;
  - limite de envios por e-mail e por endereço de rede a cada hora;
  - o envio só passa pelo servidor.
- Um perfil de parceiro só aparece publicamente depois que um administrador o publica.
- Autenticação, pagamentos e matrículas não mudam.

## Pontos para você confirmar (assumi o seguinte)
- **Relação com o fundador**: The Flooring Empire e RefurbHub aparecem como "empresas vinculadas ao fundador Eduardo Araujo". Se o vínculo for outro (sócio, cofundador, diretor), me diga o termo certo.
- **Logos**: uso os logos oficiais dos próprios sites, com sua autorização como responsável pelas empresas.
- **Destino das propostas**: ficam no painel e geram um aviso por e-mail para suporte@outroangulo.com, como os avisos de venda. Me diga se prefere só o painel.

## Detalhes técnicos
- Nova tabela `partners`, a fonte única para /parceiros, a página inicial e o diretório de membros. Campos: slug, nome, kind (founder/external), relação, país, cidade, categoria, áreas[], tipos de parceria[], descrição, website, logo_url, published e position. Leitura pública só de publicados; escrita só por admin com `has_role`.
- Nova tabela `partner_proposals`. Campos: dados do formulário, partner_id opcional, origem, is_member, user_id opcional, status, admin_note e ip_hash. Sem leitura para anon ou membros; só admin seleciona e atualiza. A inserção é feita só por um server function público, com validação zod, honeypot e rate limit por ip_hash e e-mail.
- Os três parceiros entram como linhas reais na migration. Os logos vão para os ativos do projeto, sem link direto para sites externos.
- Cliques e visitas usam o analytics existente, com evento de clique de saída registrado no servidor, sem pixel.
- O sitemap inclui /parceiros e passa pelo `staticData.sitemap`.
- A página tem `head()` próprio com título e descrição.
- Testes:
  - RLS: anon não lê propostas e membro não altera status.
  - Validação do formulário e rate limit.
