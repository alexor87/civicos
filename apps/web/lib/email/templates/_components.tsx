import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

const BRAND_COLOR = '#2262ec'
const TEXT_COLOR = '#0F0F11'
const MUTED_COLOR = '#4B5563'
const FOOTER_COLOR = '#9CA3AF'
const BORDER_COLOR = '#E5E7EB'
const BACKGROUND = '#f7f7f8'

const fontStack =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

export function EmailLayout({
  preview,
  children,
}: {
  preview: string
  children: ReactNode
}) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          background: BACKGROUND,
          fontFamily: fontStack,
          color: TEXT_COLOR,
        }}
      >
        <Container
          style={{
            maxWidth: '560px',
            margin: '40px auto',
            padding: 0,
            background: '#ffffff',
            border: `1px solid ${BORDER_COLOR}`,
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <Section style={{ padding: '28px 32px 8px 32px' }}>
            <Text
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: TEXT_COLOR,
                margin: 0,
              }}
            >
              Scrutix
            </Text>
          </Section>
          {children}
          <Hr style={{ borderColor: BORDER_COLOR, margin: 0 }} />
          <Section style={{ padding: '16px 32px 24px 32px' }}>
            <Text
              style={{
                fontSize: '12px',
                lineHeight: '18px',
                color: FOOTER_COLOR,
                margin: 0,
              }}
            >
              Si no esperabas este correo, puedes ignorarlo de forma segura.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export function EmailHeading({ children }: { children: ReactNode }) {
  return (
    <Section style={{ padding: '16px 32px 0 32px' }}>
      <Text
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: TEXT_COLOR,
          margin: '16px 0 8px',
          lineHeight: '28px',
        }}
      >
        {children}
      </Text>
    </Section>
  )
}

export function EmailParagraph({ children }: { children: ReactNode }) {
  return (
    <Section style={{ padding: '0 32px' }}>
      <Text
        style={{
          fontSize: '15px',
          lineHeight: '22px',
          color: MUTED_COLOR,
          margin: '0 0 16px',
        }}
      >
        {children}
      </Text>
    </Section>
  )
}

export function EmailButton({ href, label }: { href: string; label: string }) {
  return (
    <Section style={{ padding: '8px 32px 24px 32px' }}>
      <Button
        href={href}
        style={{
          display: 'inline-block',
          background: BRAND_COLOR,
          color: '#ffffff',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '15px',
          padding: '12px 20px',
          borderRadius: '8px',
        }}
      >
        {label}
      </Button>
    </Section>
  )
}

export function EmailFallbackLink({ href }: { href: string }) {
  return (
    <Section style={{ padding: '0 32px 24px 32px' }}>
      <Text
        style={{
          fontSize: '13px',
          lineHeight: '20px',
          color: '#6B7280',
          margin: '0 0 8px',
        }}
      >
        Si el botón no funciona, copia este enlace en tu navegador:
      </Text>
      <Text
        style={{
          fontSize: '12px',
          lineHeight: '18px',
          color: '#6B7280',
          wordBreak: 'break-all',
          margin: 0,
        }}
      >
        {href}
      </Text>
    </Section>
  )
}
