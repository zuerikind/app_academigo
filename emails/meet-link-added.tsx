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

interface MeetLinkAddedEmailProps {
  studentName: string;
  teacherName: string;
  startTime: string;
  meetingLink: string;
}

export function MeetLinkAddedEmail({
  studentName,
  teacherName,
  startTime,
  meetingLink,
}: MeetLinkAddedEmailProps) {
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
      <Preview>Meeting link ready for your lesson with {teacherName} on {formattedDate}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "24px",
            backgroundColor: "#fff",
          }}
        >
          <Heading style={{ color: "#1a1a1a" }}>Meeting link added!</Heading>
          <Text>Hi {studentName},</Text>
          <Text>
            Your teacher <strong>{teacherName}</strong> has added the meeting
            link for your lesson on <strong>{formattedDate}</strong> (Zurich
            time).
          </Text>
          <Text>Join your lesson here:</Text>
          <Link href={meetingLink} style={{ color: "#0070f3" }}>
            {meetingLink}
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
