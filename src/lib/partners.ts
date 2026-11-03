import { z } from "zod";

export const PARTNER_INTERESTS = [
  "Oferecer serviços",
  "Contratar especialistas",
  "Propor parceria comercial",
  "Procurar sócio",
  "Apresentar startup ou projeto",
  "Colaborar com o Outro Ângulo",
  "Contatar uma empresa parceira",
] as const;

export const PROPOSAL_STATUS = {
  novo: "Novo",
  em_analise: "Em análise",
  contatado: "Contatado",
  qualificado: "Qualificado",
  convertido: "Convertido",
  encerrado: "Encerrado",
} as const;
export type ProposalStatus = keyof typeof PROPOSAL_STATUS;

export const BADGES = {
  founder: "Parceiro fundador",
  external: "Parceiro externo",
  verified: "Especialista verificado",
  member: "Membro da comunidade",
} as const;

export const FOUNDER_NOTE =
  "“Parceiro fundador” indica que a empresa participa da formação inicial do ecossistema. Não é uma avaliação independente de qualidade.";

/** Max proposals accepted per hour from one network address or one e-mail. */
export const PROPOSAL_HOURLY_LIMIT = 3;

export const proposalSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  country: z.string().trim().max(60).optional().or(z.literal("")),
  area: z.string().trim().max(100).optional().or(z.literal("")),
  interest: z.enum(PARTNER_INTERESTS),
  proposal: z.string().trim().min(20, "Descreva a proposta (mín. 20 caracteres)").max(2000),
  link: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https:\/\/[^\s]+$/i.test(v), "Use um link https://")
    .optional(),
  partnerId: z.string().uuid().optional(),
  origin: z.string().max(60).regex(/^[a-z0-9/_-]*$/i).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "É preciso autorizar o uso dos dados" }) }),
  website: z.string().max(0).optional(), // honeypot: must stay empty
});
export type ProposalInput = z.infer<typeof proposalSchema>;

export function overLimit(recentByIp: number, recentByEmail: number) {
  return recentByIp >= PROPOSAL_HOURLY_LIMIT || recentByEmail >= PROPOSAL_HOURLY_LIMIT;
}
