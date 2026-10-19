// Email clients need inline styles; keep the brand palette centralized here.
export const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
export const container = { maxWidth: '560px', padding: '32px 24px', borderTop: '4px solid #C7D84B' }
export const brand = { fontFamily: 'Manrope, Arial, sans-serif', fontSize: '18px', fontWeight: 'bold' as const, color: '#14213D', margin: '0 0 28px' }
export const h1 = { fontFamily: 'Manrope, Arial, sans-serif', fontSize: '26px', fontWeight: 'bold' as const, color: '#14213D', margin: '0 0 20px' }
export const text = { fontSize: '16px', color: '#171A1F', lineHeight: '1.6', margin: '0 0 24px' }
export const link = { color: '#14213D', textDecoration: 'underline' }
export const button = { backgroundColor: '#14213D', color: '#ffffff', fontSize: '16px', fontWeight: 'bold' as const, border: '1px solid #14213D', borderRadius: '4px', padding: '14px 24px', textDecoration: 'none' }
export const footer = { fontSize: '13px', color: '#65758B', lineHeight: '1.6', margin: '30px 0 0' }
export const codeStyle = { fontFamily: 'monospace', fontSize: '28px', fontWeight: 'bold' as const, color: '#14213D', margin: '0 0 30px' }
export const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #14213D !important; color: #ffffff !important; }
  }
  [data-ogsc] .dm-btn { background-color: #14213D !important; color: #ffffff !important; }
  [data-ogsb] .dm-btn { background-color: #14213D !important; color: #ffffff !important; }
`
