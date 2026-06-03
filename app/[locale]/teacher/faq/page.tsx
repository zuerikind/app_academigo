import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getTeacherNav } from "@/config/navigation";
import { requireRoleFromParams } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";

type Props = { params: Promise<{ locale: string }> };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-academy-line bg-white p-6">
      <h2 className="mb-4 font-display text-[17px] font-semibold text-academy-navy">{title}</h2>
      {children}
    </div>
  );
}

function Q({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="mb-1.5 text-[14px] font-semibold text-academy-navy">{q}</p>
      <div className="text-[13.5px] leading-relaxed text-academy-slate">{children}</div>
    </div>
  );
}

function LevelRow({
  level,
  label,
  rate,
  badge,
  requirements,
}: {
  level: string;
  label: string;
  rate: string;
  badge: string | null;
  requirements: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[10px] border border-academy-line p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[color:var(--brand)]/10 px-2.5 py-0.5 text-[12px] font-semibold text-[color:var(--brand-deep)]">
            {label}
          </span>
          {badge && (
            <span className="inline-flex items-center rounded-full border border-academy-line bg-academy-mist px-2.5 py-0.5 text-[11px] text-academy-slate">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[12px] text-academy-slate">{requirements}</p>
      </div>
      <p className="shrink-0 text-[13px] font-semibold text-academy-navy">{rate}</p>
    </div>
  );
}

export default async function TeacherFaqPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);

  const isDE = raw === "de";

  await requireRoleFromParams("teacher", raw);

  return (
    <DashboardLayout
      navItems={getTeacherNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={isDE ? "Informationen" : "Information"}
      title={isDE ? "Stufen & FAQ" : "Levels & FAQ"}
      subtitle={isDE ? "Wie das Stufensystem funktioniert und häufige Fragen" : "How the level system works and common questions"}
    >
      <div className="space-y-6">
        <Link
          href={localizedPath(raw, "/teacher/dashboard")}
          className="inline-flex items-center gap-1 text-[13px] text-academy-slate hover:text-academy-navy"
        >
          ← {isDE ? "Zurück zum Dashboard" : "Back to Dashboard"}
        </Link>

        {/* Level system */}
        <Section title={isDE ? "Das Stufensystem" : "The Level System"}>
          <p className="mb-5 text-[13.5px] leading-relaxed text-academy-slate">
            {isDE
              ? "Academigo hat drei Lehrpersonenstufen. Je höher die Stufe, desto höher dein Stundensatz und desto prominenter deine Sichtbarkeit für Lernende."
              : "Academigo has three teacher levels. The higher your level, the higher your hourly rate and the more prominently you appear to students."}
          </p>
          <div className="space-y-3">
            <LevelRow
              level="junior"
              label={isDE ? "Junior-Lehrperson" : "Junior Teacher"}
              rate="CHF 35–40 / h"
              badge={null}
              requirements={
                isDE
                  ? "Einstiegsstufe — alle neu genehmigten Lehrpersonen starten hier."
                  : "Entry level — all newly approved teachers start here."
              }
            />
            <LevelRow
              level="academigo_teacher"
              label={isDE ? "Academigo-Lehrperson" : "Academigo Teacher"}
              rate="CHF 45 / h"
              badge={isDE ? '"Academigo Zertifiziert"' : '"Academigo Certified"'}
              requirements={
                isDE
                  ? "Mindestens 10 abgeschlossene Lektionen · Durchschnittsbewertung ≥ 4,0 ★ · Genehmigung durch Admin"
                  : "At least 10 completed sessions · Average rating ≥ 4.0 ★ · Admin approval"
              }
            />
            <LevelRow
              level="verified"
              label={isDE ? "Verifizierte Lehrperson" : "Verified Teacher"}
              rate="CHF 50–60 / h"
              badge={isDE ? '"Verifizierte Lehrperson" + Priorität' : '"Verified Teacher" + priority listing'}
              requirements={
                isDE
                  ? "Mindestens 30 abgeschlossene Lektionen · Durchschnittsbewertung ≥ 4,5 ★ · Genehmigung durch Admin"
                  : "At least 30 completed sessions · Average rating ≥ 4.5 ★ · Admin approval"
              }
            />
          </div>
        </Section>

        {/* How to advance */}
        <Section title={isDE ? "Wie wechsle ich die Stufe?" : "How do I advance to the next level?"}>
          <ol className="space-y-3 text-[13.5px] leading-relaxed text-academy-slate">
            {(isDE ? [
              "Schliesse die erforderliche Anzahl Lektionen ab und halte deine Bewertung über dem Schwellenwert.",
              "Du kannst deinen Fortschritt jederzeit auf dem Dashboard unter «Deine Lehrpersonenstufe» einsehen.",
              "Sobald du die Anforderungen erfüllst, kontaktiere uns per E-Mail an omid@academigo.xyz mit dem Betreff «Stufenaufstieg».",
              "Unser Team prüft dein Profil und deine Bewertungen und gibt dir innerhalb weniger Werktage eine Rückmeldung.",
              "Nach der Genehmigung wird deine Stufe und dein Stundensatz aktualisiert.",
            ] : [
              "Complete the required number of sessions and maintain your rating above the threshold.",
              "You can track your progress at any time on the Dashboard under 'Your teacher level'.",
              "Once you meet the requirements, contact us by email at omid@academigo.xyz with the subject 'Level promotion'.",
              "Our team reviews your profile and ratings and responds within a few business days.",
              "After approval, your level and hourly rate are updated.",
            ]).map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand)]/10 text-[11px] font-bold text-[color:var(--brand-deep)]">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        {/* FAQ */}
        <Section title="FAQ">
          <Q q={isDE ? "Wann werde ich bezahlt?" : "When do I get paid?"}>
            {isDE
              ? "Sobald du eine Lektion als abgeschlossen markierst, wird der Betrag deinem ausstehenden Saldo gutgeschrieben. Du kannst jederzeit auf der Einnahmen-Seite eine Auszahlung beantragen. Wir verarbeiten Auszahlungen manuell via IBAN oder Twint innerhalb von 3–5 Werktagen."
              : "As soon as you mark a session as complete, the amount is credited to your pending balance. You can request a payout at any time on the Earnings page. We process payouts manually via IBAN or Twint within 3–5 business days."}
          </Q>
          <Q q={isDE ? "Wie wird mein Stundensatz berechnet?" : "How is my hourly rate calculated?"}>
            {isDE
              ? "Dein Stundensatz hängt von deiner Stufe ab (CHF 30 für Junior, CHF 45 für Academigo, CHF 60 für Verifiziert). Dein aktueller Satz ist auf dem Dashboard und der Einnahmen-Seite sichtbar."
              : "Your rate depends on your level (CHF 30 for Junior, CHF 45 for Academigo, CHF 60 for Verified). Your current rate is visible on the Dashboard and Earnings page."}
          </Q>
          <Q q={isDE ? "Warum sehe ich noch keine Bewertungen?" : "Why do I have no reviews yet?"}>
            {isDE
              ? "Bewertungen erscheinen erst, nachdem du eine Lektion als abgeschlossen markiert hast und der/die Lernende eine Bewertung abgegeben hat. Lernende können nach jeder abgeschlossenen Lektion eine Bewertung hinterlassen."
              : "Reviews appear only after you mark a session as complete and the student leaves feedback. Students can leave a review after every completed session."}
          </Q>
          <Q q={isDE ? "Was bedeutet 'Ausstehender Saldo'?" : "What does 'Pending balance' mean?"}>
            {isDE
              ? "Der ausstehende Saldo sind deine verdienten Einnahmen, die noch nicht ausgezahlt wurden. Sobald du eine Auszahlung beantragst, wird der Saldo auf 0 zurückgesetzt und du erhältst die Zahlung innerhalb weniger Werktage."
              : "Pending balance is your earned income that hasn't been paid out yet. Once you request a payout, the balance resets to 0 and you receive the payment within a few business days."}
          </Q>
          <Q q={isDE ? "Muss ich mein Profil vollständig ausfüllen?" : "Do I need to complete my profile?"}>
            {isDE
              ? "Ja. Ein vollständiges Profil (Bio, Ausbildung, Erfahrung, Unterrichtsstil) erhöht deine Sichtbarkeit bei Lernenden und ist Voraussetzung für einen Stufenaufstieg. Den Fortschritt siehst du auf dem Dashboard."
              : "Yes. A complete profile (bio, education, experience, teaching style) increases your visibility to students and is required for a level promotion. You can see your progress on the Dashboard."}
          </Q>
          <Q q={isDE ? "Kann ich Lektionen absagen?" : "Can I cancel a session?"}>
            {isDE
              ? "Du kannst bestätigte Lektionen über die Buchungsseite absagen. Bitte vermeide kurzfristige Absagen — häufige Absagen können sich negativ auf deinen Stufenaufstieg auswirken."
              : "You can cancel confirmed sessions from the Bookings page. Please avoid last-minute cancellations — frequent cancellations can negatively affect your level progression."}
          </Q>
          <Q q={isDE ? "Wie kontaktiere ich das Academigo-Team?" : "How do I contact the Academigo team?"}>
            {isDE ? (
              <>Schreib uns an <a href="mailto:omid@academigo.xyz" className="font-medium text-[color:var(--brand-deep)] hover:underline">omid@academigo.xyz</a> — wir antworten innerhalb von 1–2 Werktagen.</>
            ) : (
              <>Email us at <a href="mailto:omid@academigo.xyz" className="font-medium text-[color:var(--brand-deep)] hover:underline">omid@academigo.xyz</a> — we respond within 1–2 business days.</>
            )}
          </Q>
        </Section>
      </div>
    </DashboardLayout>
  );
}
