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
} from "@react-email/components";

const NAVY = "#0EA5E9";
const BG = "#EEF2F7";
const WHITE = "#FFFFFF";
const BODY_TEXT = "#374151";
const MUTED = "#6B7280";

export function AdminTeacherApplicationEmail({
  teacherName,
  reviewUrl,
}: {
  teacherName: string;
  reviewUrl: string;
}) {
  return (
    <Html lang="de">
      <Head />
      <Body
        style={{
          backgroundColor: BG,
          margin: "0",
          padding: "40px 16px",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>
          <Section style={{ backgroundColor: NAVY, padding: "20px 32px" }}>
            <Text
              style={{ color: WHITE, fontSize: "18px", fontWeight: "700", margin: "0" }}
            >
              Academigo
            </Text>
          </Section>

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
              Neue Lehrerbewerbung
            </Heading>
            <Text
              style={{ color: BODY_TEXT, fontSize: "16px", lineHeight: "26px", margin: "0 0 28px" }}
            >
              <strong>{teacherName}</strong> hat soeben eine Bewerbung als Lehrer eingereicht.
              <br />
              <br />
              Bitte prüfe das Profil und entscheide über die Freigabe.
            </Text>

            <Button
              href={reviewUrl}
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
              Bewerbung prüfen →
            </Button>
          </Section>

          <Section style={{ padding: "20px 32px 0" }}>
            <Hr style={{ borderColor: "#D1D5DB", margin: "0 0 16px" }} />
            <Text
              style={{ color: MUTED, fontSize: "12px", margin: "0", textAlign: "center" as const }}
            >
              Academigo — Swiss Academic Tutoring
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
