import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Preview,
} from "@react-email/components";

const NAVY = "#2B5585";
const BG = "#EEF2F7";
const WHITE = "#FFFFFF";
const BODY_TEXT = "#374151";
const MUTED = "#6B7280";

export function PasswordResetEmail({
  resetUrl,
  fullName,
}: {
  resetUrl: string;
  fullName?: string;
}) {
  return (
    <Html lang="de">
      <Head />
      <Preview>Setze dein Academigo-Passwort zurück</Preview>
      <Body
        style={{
          backgroundColor: BG,
          margin: "0",
          padding: "40px 16px",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>

          {/* Brand header */}
          <Section style={{ backgroundColor: NAVY, padding: "20px 32px" }}>
            <Text
              style={{
                color: WHITE,
                fontSize: "18px",
                fontWeight: "700",
                margin: "0",
                letterSpacing: "-0.2px",
              }}
            >
              Academigo
            </Text>
          </Section>

          {/* Card body */}
          <Section style={{ backgroundColor: WHITE, padding: "36px 32px 40px" }}>
            <Heading
              style={{
                color: "#111827",
                fontSize: "22px",
                fontWeight: "700",
                lineHeight: "1.3",
                margin: "0 0 16px",
              }}
            >
              Passwort zurücksetzen
            </Heading>
            <Text
              style={{
                color: BODY_TEXT,
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 28px",
              }}
            >
              Hallo{fullName ? ` ${fullName}` : ""},
              <br />
              <br />
              du hast ein neues Passwort für dein Academigo-Konto angefordert.
              Klicke auf den Button unten, um es zurückzusetzen.
            </Text>

            <Button
              href={resetUrl}
              style={{
                backgroundColor: NAVY,
                color: WHITE,
                fontSize: "15px",
                fontWeight: "600",
                padding: "14px 28px",
                borderRadius: "6px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Passwort zurücksetzen →
            </Button>

            <Text
              style={{
                color: MUTED,
                fontSize: "13px",
                lineHeight: "20px",
                margin: "32px 0 0",
              }}
            >
              Falls du kein neues Passwort angefordert hast, kannst du diese
              E-Mail ignorieren. Dein Passwort bleibt unverändert.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ padding: "20px 32px 0" }}>
            <Hr style={{ borderColor: "#D1D5DB", margin: "0 0 16px" }} />
            <Text
              style={{
                color: MUTED,
                fontSize: "12px",
                margin: "0",
                textAlign: "center" as const,
              }}
            >
              Academigo — Swiss Academic Tutoring
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
