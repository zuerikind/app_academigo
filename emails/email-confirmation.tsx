import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Link,
  Hr,
  Preview,
} from "@react-email/components";

export function EmailConfirmationEmail({
  confirmationUrl,
  fullName,
}: {
  confirmationUrl: string;
  fullName?: string;
}) {
  return (
    <Html lang="de">
      <Preview>Bestätige deine E-Mail-Adresse, um dein Academigo-Konto zu aktivieren</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "24px",
            backgroundColor: "#fff",
          }}
        >
          <Heading style={{ color: "#1a1a1a" }}>E-Mail bestätigen</Heading>
          <Text>Hallo{fullName ? ` ${fullName}` : ""},</Text>
          <Text>
            Klicke auf den folgenden Link, um dein Academigo-Konto zu
            aktivieren:
          </Text>
          <Link href={confirmationUrl} style={{ color: "#0070f3" }}>
            Konto aktivieren
          </Link>
          <Text style={{ fontSize: "14px", color: "#888", marginTop: "24px" }}>
            Falls du dich nicht bei Academigo registriert hast, kannst du diese
            E-Mail ignorieren.
          </Text>
          <Hr />
          <Text style={{ fontSize: "12px", color: "#666" }}>
            Academigo — Swiss Academic Tutoring
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
