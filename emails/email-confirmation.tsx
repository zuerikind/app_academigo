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
const BG = "#F4F7FA";
const TEXT = "#374151";
const MUTED = "#6B7280";

export function EmailConfirmationEmail({
  confirmationUrl,
  fullName,
}: {
  confirmationUrl: string;
  fullName?: string;
}) {
  return (
    <Html lang="de">
      <Head />
      <Preview>Bestätige deine E-Mail-Adresse, um dein Academigo-Konto zu aktivieren</Preview>
      <Body style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", backgroundColor: BG, margin: "0", padding: "0" }}>
        <Section style={{ backgroundColor: NAVY, padding: "24px 40px" }}>
          <Text style={{ color: "#fff", fontSize: "20px", fontWeight: "700", margin: "0" }}>
            Academigo
          </Text>
        </Section>
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>
          <Section style={{ backgroundColor: "#fff", padding: "40px", borderRadius: "0 0 8px 8px" }}>
            <Heading style={{ color: "#111827", fontSize: "24px", fontWeight: "700", margin: "0 0 16px" }}>
              E-Mail bestätigen
            </Heading>
            <Text style={{ color: TEXT, fontSize: "16px", lineHeight: "24px", margin: "0 0 8px" }}>
              Hallo{fullName ? ` ${fullName}` : ""},
            </Text>
            <Text style={{ color: TEXT, fontSize: "16px", lineHeight: "24px", margin: "0 0 32px" }}>
              Klicke auf den Button, um dein Academigo-Konto zu aktivieren:
            </Text>
            <Button
              href={confirmationUrl}
              style={{
                backgroundColor: NAVY,
                color: "#fff",
                fontSize: "15px",
                fontWeight: "600",
                padding: "14px 28px",
                borderRadius: "8px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Konto aktivieren
            </Button>
            <Text style={{ color: MUTED, fontSize: "13px", marginTop: "32px", lineHeight: "20px" }}>
              Falls du dich nicht bei Academigo registriert hast, kannst du diese E-Mail ignorieren.
            </Text>
            <Hr style={{ borderColor: "#E5E7EB", margin: "24px 0 16px" }} />
            <Text style={{ color: MUTED, fontSize: "12px", margin: "0" }}>
              Academigo — Swiss Academic Tutoring
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
