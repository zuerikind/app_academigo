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

interface TeacherApprovedEmailProps {
  teacherName: string;
  dashboardUrl: string;
}

export function TeacherApprovedEmail({
  teacherName,
  dashboardUrl,
}: TeacherApprovedEmailProps) {
  return (
    <Html lang="en">
      <Preview>Your Academigo teacher profile is live — students can now find you</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "24px",
            backgroundColor: "#fff",
          }}
        >
          <Heading style={{ color: "#1a1a1a" }}>Your profile is approved!</Heading>
          <Text>Hi {teacherName},</Text>
          <Text>
            Great news — your Academigo teacher profile has been reviewed and
            approved. Students can now find you and request lessons.
          </Text>
          <Text>
            Head to your dashboard to set your availability, add a profile
            photo, and start accepting bookings:
          </Text>
          <Link href={dashboardUrl} style={{ color: "#0070f3" }}>
            Go to your dashboard
          </Link>
          <Hr />
          <Text style={{ fontSize: "12px", color: "#666" }}>
            Academigo — Swiss Academic Tutoring
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
