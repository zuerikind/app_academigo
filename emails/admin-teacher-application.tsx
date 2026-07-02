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
  teacherEmail,
  subjects,
  languages,
  offersOnline,
  offersInPerson,
  location,
  education,
  experience,
  bio,
  motivationLetter,
  reviewUrl,
}: {
  teacherName: string;
  teacherEmail: string;
  subjects: string[];
  languages: string[];
  offersOnline: boolean;
  offersInPerson: boolean;
  location?: string | null;
  education: string;
  experience: string;
  bio: string;
  motivationLetter: string;
  reviewUrl: string;
}) {
  const modality = [
    offersOnline && "Online",
    offersInPerson && `Vor Ort${location ? ` (${location})` : ""}`,
  ]
    .filter(Boolean)
    .join(", ");

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
        <Container style={{ maxWidth: "600px", margin: "0 auto" }}>
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
                margin: "0 0 8px",
              }}
            >
              Neue Lehrerbewerbung
            </Heading>
            <Text style={{ color: MUTED, fontSize: "14px", margin: "0 0 28px" }}>
              Eine neue Bewerbung wartet auf deine Prüfung.
            </Text>

            {/* Quick facts */}
            <Row label="Name" value={teacherName} />
            <Row label="E-Mail" value={teacherEmail} />
            <Row label="Fächer" value={subjects.join(", ") || "—"} />
            <Row label="Sprachen" value={languages.join(", ") || "—"} />
            <Row label="Unterrichtsform" value={modality || "—"} />

            <Hr style={{ borderColor: "#E5E7EB", margin: "24px 0" }} />

            <Field label="Ausbildung" value={education} />
            <Field label="Erfahrung" value={experience} />
            <Field label="Bio" value={bio} />
            <Field label="Motivationsschreiben" value={motivationLetter} />

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
                marginTop: "8px",
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ color: BODY_TEXT, fontSize: "14px", margin: "0 0 6px", lineHeight: "20px" }}>
      <span style={{ fontWeight: "600", minWidth: "120px", display: "inline-block" }}>
        {label}:
      </span>{" "}
      {value}
    </Text>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Text
        style={{ color: "#6B7280", fontSize: "12px", fontWeight: "600", margin: "0 0 4px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}
      >
        {label}
      </Text>
      <Text
        style={{ color: BODY_TEXT, fontSize: "14px", lineHeight: "22px", margin: "0 0 20px", whiteSpace: "pre-wrap" as const }}
      >
        {value}
      </Text>
    </>
  );
}
