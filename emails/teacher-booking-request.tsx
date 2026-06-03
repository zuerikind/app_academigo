import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Link,
  Hr,
} from "@react-email/components";

interface TeacherBookingRequestEmailProps {
  teacherName: string;
  studentName: string;
  startTime: string;
  topicNote: string | null;
  dashboardUrl: string;
}

export function TeacherBookingRequestEmail({
  teacherName,
  studentName,
  startTime,
  topicNote,
  dashboardUrl,
}: TeacherBookingRequestEmailProps) {
  const formattedDate = new Date(startTime).toLocaleDateString("de-CH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Zurich",
  });

  return (
    <Html lang="en">
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "24px",
            backgroundColor: "#fff",
          }}
        >
          <Heading style={{ color: "#1a1a1a" }}>New lesson request</Heading>
          <Text>Hi {teacherName},</Text>
          <Text>
            <strong>{studentName}</strong> has requested a lesson on{" "}
            <strong>{formattedDate}</strong> (Zurich time).
          </Text>
          {topicNote && (
            <Text>
              <strong>Topic note:</strong> {topicNote}
            </Text>
          )}
          <Text>Please confirm or decline the request in your dashboard:</Text>
          <Link href={dashboardUrl} style={{ color: "#0070f3" }}>
            Go to dashboard
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
