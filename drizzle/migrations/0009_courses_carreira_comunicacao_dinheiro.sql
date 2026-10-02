INSERT INTO public.courses (slug, title, subtitle, instructor, level, status, is_public, access_policy, position) VALUES
('chegue-forte-ao-mercado','Chegue forte ao mercado de trabalho','Uma apresentação profissional que mostra o que você sabe fazer.',NULL,'Iniciante','published',true,'enrollment',6),
('carreira-nao-emprego','Construa uma carreira, não apenas um emprego','Onde você está, o que desenvolver e para onde ir.',NULL,'Fundamentos','published',true,'enrollment',7),
('mudar-de-carreira','Quero mudar de carreira. E agora?','Explore uma mudança sem jogar sua trajetória fora.',NULL,'Fundamentos','published',true,'enrollment',8),
('o-proximo-passo','O próximo passo','Qual movimento faz mais sentido agora.',NULL,'Fundamentos','published',true,'enrollment',9),
('entrevista-sem-resposta-decorada','Entrevista sem resposta decorada','Entenda a vaga e comunique o que você pode entregar.',NULL,'Iniciante','published',true,'enrollment',10),
('linkedin-cv-e-presenca','LinkedIn, CV e presença profissional','Organize sua experiência para ser entendido rápido.',NULL,'Iniciante','published',true,'enrollment',11),
('comunicacao-profissional','Comunicação profissional','Fale, escreva e se posicione com mais clareza no trabalho.',NULL,'Fundamentos','published',true,'enrollment',12),
('dinheiro-sem-complicacao','Dinheiro sem complicação','A matemática da sua vida financeira, sem complicação.',NULL,'Iniciante','published',true,'enrollment',13)
ON CONFLICT (slug) DO NOTHING;