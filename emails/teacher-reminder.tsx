import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Link,
  Hr,
} from "@react-email/components";

interface TeacherReminderEmailProps {
  teacherName: string;
  studentName: string;
  startTime: string;
  meetingLink: string | null;
  hoursUntil?: 24 | 1;
}

export function TeacherReminderEmail({
  teacherName,
  studentName,
  startTime,
  meetingLink,
  hoursUntil,
}: TeacherReminderEmailProps) {
  const formattedDate = new Date(startTime).toLocaleDateString("de-CH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Zurich",
  });

  const timeLabel = hoursUntil
    ? `in ${hoursUntil} hour${hoursUntil === 1 ? "" : "s"}`
    : "soon";

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
          <Heading style={{ color: "#1a1a1a" }}>
            Upcoming lesson reminder
          </Heading>
          <Text>Hi {teacherName},</Text>
          <Text>
            You have a lesson with <strong>{studentName}</strong> on{" "}
            <strong>{formattedDate}</strong> (Zurich time) — {timeLabel}.
          </Text>
          {meetingLink ? (
            <>
              <Text>
                Your meeting link is set:
              </Text>
              <Link href={meetingLink} style={{ color: "#0070f3" }}>
                {meetingLink}
              </Link>
            </>
          ) : (
            <Text
              style={{
                color: "#b91c1c",
                backgroundColor: "#fef2f2",
                padding: "12px",
                borderRadius: "6px",
              }}
            >
              <strong>Action required:</strong> Please add your Google Meet link
              before the lesson — students are waiting. You can add it from your
              bookings page.
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
