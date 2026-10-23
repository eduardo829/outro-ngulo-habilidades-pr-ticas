import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { main, container, brand, h1, text, footer } from './theme'

interface Props {
  course?: string
  amount?: string
  buyer?: string
  method?: string
  origem?: string
  when?: string
}

const SaleEmail = ({ course, amount, buyer, method, origem, when }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Nova venda: ${course ?? 'curso'} · ${amount ?? ''}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Outro Ângulo · Vendas</Text>
        <Heading style={h1}>Nova venda confirmada</Heading>
        <Text style={text}>
          Curso: <strong>{course ?? '—'}</strong><br />
          Valor: <strong>{amount ?? '—'}</strong><br />
          Comprador: <strong>{buyer ?? '—'}</strong><br />
          Pagamento: <strong>{method ?? '—'}</strong><br />
          Origem: <strong>{origem || 'sem origem'}</strong><br />
          Data: <strong>{when ?? '—'}</strong>
        </Text>
        <Text style={footer}>Aviso interno automático, enviado quando o pagamento é confirmado. O acesso ao curso já foi liberado.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SaleEmail,
  subject: (d: Record<string, any>) => `Nova venda: ${d['course'] ?? 'curso'} · ${d['amount'] ?? ''}`,
  displayName: 'Aviso de venda (equipe)',
  to: 'suporte@outroangulo.com',
  previewData: { course: 'Corretor na prática', amount: 'R$ 127,00', buyer: 'Maria Silva', method: 'Pix', origem: 'instagram', when: '23/10/2026 13:40' },
} satisfies TemplateEntry
