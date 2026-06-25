import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Hr,
} from "@react-email/components";

interface PayoutProcessedEmailProps {
  teacherName: string;
  amountChf: number;
}

export function PayoutProcessedEmail({ teacherName, amountChf }: PayoutProcessedEmailProps) {
  return (
    <Html lang="de">
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "24px",
            backgroundColor: "#fff",
          }}
        >
          <Heading style={{ color: "#1a1a1a" }}>Deine Auszahlung ist unterwegs</Heading>
          <Text>Hallo {teacherName},</Text>
          <Text>
            Wir haben deine Auszahlung von{" "}
            <strong>CHF {amountChf.toFixed(2)}</strong> soeben veranlasst.
          </Text>
          <Text>
            Der Betrag wird spätestens in <strong>3–5 Werktagen</strong> auf deinem
            Konto gutgeschrieben.
          </Text>
          <Text>
            Bei Fragen stehen wir dir jederzeit unter{" "}
            <a href="mailto:omid@academigo.xyz">omid@academigo.xyz</a> zur Verfügung.
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
