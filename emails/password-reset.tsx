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

export function PasswordResetEmail({
  resetUrl,
  fullName,
}: {
  resetUrl: string;
  fullName?: string;
}) {
  return (
    <Html lang="de">
      <Preview>Setze dein Academigo-Passwort zurück</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "24px",
            backgroundColor: "#fff",
          }}
        >
          <Heading style={{ color: "#1a1a1a" }}>Passwort zurücksetzen</Heading>
          <Text>Hallo{fullName ? ` ${fullName}` : ""},</Text>
          <Text>
            Du hast ein neues Passwort für dein Academigo-Konto angefordert.
            Klicke auf den folgenden Link, um dein Passwort zurückzusetzen:
          </Text>
          <Link href={resetUrl} style={{ color: "#0070f3" }}>
            Passwort zurücksetzen
          </Link>
          <Text style={{ fontSize: "14px", color: "#888", marginTop: "24px" }}>
            Falls du kein neues Passwort angefordert hast, kannst du diese
            E-Mail ignorieren. Dein Passwort bleibt unverändert.
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
