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

interface BookingConfirmationEmailProps {
  studentName: string;
  teacherName: string;
  startTime: string;
  meetingLink: string | null;
}

export function BookingConfirmationEmail({
  studentName,
  teacherName,
  startTime,
  meetingLink,
}: BookingConfirmationEmailProps) {
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
      <Preview>Your lesson with {teacherName} on {formattedDate} is confirmed</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "24px",
            backgroundColor: "#fff",
          }}
        >
          <Heading style={{ color: "#1a1a1a" }}>
            Your lesson is confirmed!
          </Heading>
          <Text>Hi {studentName},</Text>
          <Text>
            Your lesson with <strong>{teacherName}</strong> on{" "}
            <strong>{formattedDate}</strong> (Zurich time) is confirmed.
          </Text>
          {meetingLink ? (
            <>
              <Text>Join your lesson here:</Text>
              <Link href={meetingLink} style={{ color: "#0070f3" }}>
                {meetingLink}
              </Link>
            </>
          ) : (
            <Text>
              Your teacher will share the meeting link shortly. We&apos;ll
              notify you when it&apos;s added.
            </Text>
          )}
          <Hr />
          <Text style={{ fontSize: "12px", color: "#666" }}>
            Academigo — Swiss Academic Tutoring
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
