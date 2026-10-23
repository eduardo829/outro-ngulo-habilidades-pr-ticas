import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Hr } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { main, container, brand, h1, text, footer } from './theme'
import { brDate, reportSections, type AdminReport } from '../report-types'

const AdminReportEmail = ({ report }: { report?: AdminReport }) => {
  if (!report) return (
    <Html lang="pt-BR"><Head /><Body style={main}><Container style={container}><Text style={text}>Relatório indisponível.</Text></Container></Body></Html>
  )
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{`Relatório de ${brDate(report.from)} a ${brDate(report.to)}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>Outro Ângulo · Administração</Text>
          <Heading style={h1}>Relatório {brDate(report.from)} – {brDate(report.to)}</Heading>
          {report.analysis && (
            <Section>
              <Text style={label}>LEITURA DO PERÍODO</Text>
              {report.analysis.map((p, i) => <Text key={i} style={item}>• {p}</Text>)}
              <Hr style={rule} />
            </Section>
          )}
          {reportSections(report).filter((s) => s.lines.length).map((s) => (
            <Section key={s.title} style={{ margin: '0 0 18px' }}>
              <Text style={label}>{s.title.toUpperCase()}</Text>
              {s.lines.map((l) => (
                <Text key={l.label} style={item}>{l.label}: <strong>{s.fmt ? s.fmt(l.value) : l.value}</strong></Text>
              ))}
            </Section>
          ))}
          <Text style={footer}>Relatório interno gerado a pedido no painel de administração. Dados do sistema; custo de IA é estimativa.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AdminReportEmail,
  subject: (d: Record<string, any>) => d['report'] ? `Relatório Outro Ângulo ${brDate(d['report'].from)} a ${brDate(d['report'].to)}` : 'Relatório Outro Ângulo',
  displayName: 'Relatório da administração',
  previewData: { report: { from: '2026-10-16', to: '2026-10-23', generatedAt: '', sales: { paidCount: 3, revenueCents: 38100, byCourse: [{ label: 'Corretor na prática', value: 3 }], byOrigin: [{ label: 'instagram', value: 2 }], failedCount: 1, failedReasons: [], pendingCount: 0 }, accounts: { total: 26, newCount: 5, newConfirmed: 4, signedInInPeriod: 10 }, learning: { activeEnrollments: 9, newEnrollments: 3, neverAccessed: 1, inactive14d: 0, interest: [] }, ai: { requests: 40, estCostCents: 120, byFeature: [] }, analysis: ['Exemplo de leitura.'] } },
} satisfies TemplateEntry

const label = { fontSize: '12px', letterSpacing: '0.08em', color: '#65758B', fontWeight: 'bold' as const, margin: '0 0 6px' }
const item = { fontSize: '15px', color: '#171A1F', lineHeight: '1.5', margin: '0 0 4px' }
const rule = { borderColor: '#E5E1D8', margin: '18px 0' }
