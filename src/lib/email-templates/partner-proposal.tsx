import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { main, container, brand, h1, text, footer } from './theme'

interface Props {
  name?: string
  interest?: string
  partner?: string
  company?: string
  member?: string
}

const ProposalEmail = ({ name, interest, partner, company, member }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Nova proposta de parceria: ${interest ?? ''}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Outro Ângulo · Parcerias</Text>
        <Heading style={h1}>Nova proposta de parceria</Heading>
        <Text style={text}>
          De: <strong>{name ?? '—'}</strong>{company ? ` (${company})` : ''}<br />
          Interesse: <strong>{interest ?? '—'}</strong><br />
          Destino: <strong>{partner ?? 'Outro Ângulo'}</strong><br />
          Origem: <strong>{member ?? '—'}</strong>
        </Text>
        <Text style={footer}>Aviso interno. Os detalhes e o contato estão no painel administrativo, aba Parceiros.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ProposalEmail,
  subject: (d: Record<string, any>) => `Nova proposta de parceria: ${d['interest'] ?? ''}`,
  displayName: 'Proposta de parceria (equipe)',
  to: 'suporte@outroangulo.com',
  previewData: { name: 'Maria Silva', interest: 'Propor parceria comercial', partner: 'The Flooring Empire', company: 'Empresa X', member: 'Visitante' },
} satisfies TemplateEntry
