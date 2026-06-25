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

export function TeacherApprovedEmail({
  teacherName,
  dashboardUrl,
}: {
  teacherName: string;
  dashboardUrl: string;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your Academigo teacher profile is live — students can now find you</Preview>
      <Body style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", backgroundColor: BG, margin: "0", padding: "0" }}>
        <Section style={{ backgroundColor: NAVY, padding: "24px 40px" }}>
          <Text style={{ color: "#fff", fontSize: "20px", fontWeight: "700", margin: "0" }}>
            Academigo
          </Text>
        </Section>
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>
          <Section style={{ backgroundColor: "#fff", padding: "40px", borderRadius: "0 0 8px 8px" }}>
            <Heading style={{ color: "#111827", fontSize: "24px", fontWeight: "700", margin: "0 0 16px" }}>
              Your profile is approved!
            </Heading>
            <Text style={{ color: TEXT, fontSize: "16px", lineHeight: "24px", margin: "0 0 8px" }}>
              Hi {teacherName},
            </Text>
            <Text style={{ color: TEXT, fontSize: "16px", lineHeight: "24px", margin: "0 0 8px" }}>
              Great news — your Academigo teacher profile has been reviewed and approved. Students can now find you and request lessons.
            </Text>
            <Text style={{ color: TEXT, fontSize: "16px", lineHeight: "24px", margin: "0 0 32px" }}>
              Head to your dashboard to set your availability, add a profile photo, and start accepting bookings:
            </Text>
            <Button
              href={dashboardUrl}
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
              Go to your dashboard
            </Button>
            <Hr style={{ borderColor: "#E5E7EB", margin: "32px 0 16px" }} />
            <Text style={{ color: MUTED, fontSize: "12px", margin: "0" }}>
              Academigo — Swiss Academic Tutoring
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
