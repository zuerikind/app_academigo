/**
 * Academigo chatbot knowledge base — single source of truth.
 *
 * Every value here is extracted from the codebase (config, translations,
 * migrations, existing chat prompt). Nothing is invented. Human-readable
 * detail lives in the sibling .md files; this module is the machine-readable
 * surface the assistant imports.
 *
 * RULE: never hallucinate. Never guess prices, availability, teachers,
 * discounts, or policies. When unsure, use ESCALATION_RULES.fallback.
 */

export const ESCALATION_CONTACT = {
  email: "omid@academigo.xyz",
  whatsapp: "+41 78 693 68 98",
  whatsappUrl: "https://wa.me/41786936898",
} as const;

export const COMPANY_FACTS = {
  name: "Academigo",
  what: "A Swiss academic tutoring platform where students find vetted teachers and book paid 1:1 lessons, online or in person in Zurich.",
  coreValue:
    "Students can find a qualified, vetted teacher for any school subject and book a paid session in under two minutes.",
  marketingSite: "https://academigo.xyz",
  app: "https://app.academigo.xyz",
  currency: "CHF",
  country: "Switzerland",
  inPersonRegion: "Zurich",
  onlineAvailable: true,
  platformLanguages: ["German", "English"], // de = default
  teachingLanguages: ["German", "English", "French", "Italian", "Spanish"],
  studentLevels: ["Primary", "Secondary I", "Secondary II / Gymnasium", "University", "Other"],
  audience:
    "Swiss students from primary school through Gymnasium and university; goals: exam prep (Gymiprüfung, Matura), closing learning gaps, long-term support.",
  contact: ESCALATION_CONTACT,
  // Not verifiable from code — do not state as fact:
  unverified: {
    missionVisionStatement: "Information not verified.",
    supportResponseTime: "Information not verified (the '1–2 business days' figure is prompt copy, not code).",
    studentAgeRanges: "Information not verified (levels are named, not age-bounded).",
  },
} as const;

/** From config/pricing.ts + Supabase credit_packages. One-time only. No subscriptions. */
export const PRICING = {
  lessonDurationMinutes: 50,
  creditsPerLesson: 1,
  creditsExpire: false,
  creditsPool: true,
  subscriptions: false,
  freeTrial: false,
  discountCodes: false,
  paymentMethods: ["Visa", "Mastercard", "American Express", "TWINT"],
  processor: "Stripe",
  packages: [
    { id: "starter", name: "Academigo Starter", priceChf: 89, credits: 1, pricePerLessonChf: 89, label: null },
    { id: "focus", name: "Academigo Focus", priceChf: 425, credits: 5, pricePerLessonChf: 85, label: "Most popular · saves CHF 20" },
    { id: "excellence", name: "Academigo Excellence", priceChf: 790, credits: 10, pricePerLessonChf: 79, label: "Best value · saves CHF 100" },
  ],
  refunds:
    "No automated money refund. A timely cancellation returns the credit (not money). Money refunds → escalate to WhatsApp.",
} as const;

/** All 22 catalogue subjects (config/subjects.ts + messages subjectNames). */
export const SUBJECTS = [
  { slug: "mathematics", name: "Mathematics" },
  { slug: "applied-mathematics", name: "Applied Mathematics" },
  { slug: "physics", name: "Physics" },
  { slug: "chemistry", name: "Chemistry" },
  { slug: "biology", name: "Biology" },
  { slug: "computer-science", name: "Computer Science" },
  { slug: "german", name: "German" },
  { slug: "french", name: "French" },
  { slug: "italian", name: "Italian" },
  { slug: "english", name: "English" },
  { slug: "spanish", name: "Spanish" },
  { slug: "latin", name: "Latin" },
  { slug: "greek", name: "Greek" },
  { slug: "history", name: "History" },
  { slug: "geography", name: "Geography" },
  { slug: "economics", name: "Economics & Law" },
  { slug: "philosophy", name: "Philosophy" },
  { slug: "pedagogy-psychology", name: "Pedagogy & Psychology" },
  { slug: "religious-studies", name: "Religious Studies" },
  { slug: "visual-arts", name: "Visual Arts" },
  { slug: "music", name: "Music" },
  { slug: "sports", name: "Sports" },
] as const;

/** Live bookability is runtime data (approved teachers). Never assert it from this list. */
export const SUBJECT_AVAILABILITY_NOTE =
  "The catalogue lists 22 subjects. Whether a given subject is bookable today depends on approved teachers and is shown on the teachers page (green badge). Never state a subject is or isn't available — direct the user to the teachers page or escalate.";

/**
 * Teacher levels. ⚠️ The codebase is internally inconsistent on exact rates and
 * promotion thresholds (Teacher FAQ page vs platform_settings vs earnings.ts).
 * Present only the orientation values below; escalate for exact numbers.
 */
export const TEACHER_LEVELS = {
  orientation: [
    { level: "junior", label: "Junior Teacher", approxRateChf: 30, note: "Entry level — all newly approved teachers start here." },
    { level: "academigo_teacher", label: "Academigo Teacher", approxRateChf: 45, badge: "Academigo Certified" },
    { level: "verified", label: "Verified Teacher", approxRateChfUpTo: 60, badge: "Verified Teacher + priority listing" },
  ],
  exactThresholdsAndRates:
    "Inconsistent across sources — do not commit to a number. For exact promotion thresholds or rates, escalate to omid@academigo.xyz.",
  promotionProcess:
    "Track progress on the dashboard; when requirements are met, email omid@academigo.xyz with subject 'Level promotion'.",
  payout: "Earnings credited after a session is marked complete; teacher requests payout; admin processes; paid via IBAN or TWINT.",
} as const;

export const POLICIES = {
  creditsExpire: false,
  cancellation:
    "A confirmed lesson can be cancelled up to 24 hours before start by student or teacher; the credit is returned. Within 24 hours, cancellation isn't possible via the platform — escalate to WhatsApp. Pending (unconfirmed) bookings can be cancelled any time.",
  completion: "A teacher can mark a lesson complete only after its scheduled end time.",
  refunds: "No automated money refund; timely cancellation returns a credit. Money refunds → escalate.",
  reviews: "One review per completed booking, by the participating student only; 1–5 stars + optional comment.",
  reminders:
    "An email reminder is sent before each lesson (about 24 hours ahead). The '1 hour before' reminder in older copy is not currently active — do not promise it.",
  trialsAndDiscounts: "No free trial and no discount codes. Only per-package per-lesson savings (Focus CHF 20, Excellence CHF 100).",
} as const;

/** Features that do NOT exist — never describe these as real. */
export const NOT_AVAILABLE = [
  "homework / assignments",
  "quizzes",
  "exercise or worksheet generation",
  "student progress tracking / XP / levels",
  "badges for students",
  "hints",
  "snapshots",
  "in-app notification feed (notifications are email only)",
  "recurring lesson series booking (exists in code but not reachable by users)",
  "subscriptions / monthly plans",
] as const;

export const ESCALATION_RULES = {
  fallback:
    "I don't have verified information about that. Please contact Academigo via WhatsApp.",
  whatsappUrl: ESCALATION_CONTACT.whatsappUrl,
  /** Always hand off to WhatsApp for these topics. */
  escalateTopics: [
    "refunds",
    "account issues (login, deletion, data)",
    "lesson changes / rescheduling a specific booking",
    "specific teacher availability",
    "specific scheduling questions",
    "billing disputes / invoices",
    "technical issues",
    "exact teacher promotion thresholds or rates",
  ],
} as const;

export const SYSTEM_PROMPT = `You are the Academigo assistant on academigo.xyz, a Swiss 1:1 tutoring platform. Answer visitor questions helpfully and concisely. Always reply in the language the user writes in (German or English).

# ABSOLUTE RULES
- Use ONLY the verified facts in this prompt. Never invent or guess.
- Never guess prices, subject availability, specific teachers, discounts, or policies.
- If you are not certain from the facts below, reply exactly:
  "I don't have verified information about that. Please contact Academigo via WhatsApp."
  (In German: "Dazu habe ich keine gesicherten Informationen. Bitte kontaktiere Academigo über WhatsApp.")
- Keep answers short (2–4 sentences) unless asked for more. Warm, clear, professional. No invented facts.

# OFFER
- 1:1 tutoring across 22 Swiss school subjects: Mathematics, Applied Mathematics, Physics, Chemistry, Biology, Computer Science, German, French, Italian, English, Spanish, Latin, Greek, History, Geography, Economics & Law, Philosophy, Pedagogy & Psychology, Religious Studies, Visual Arts, Music, Sports.
- Not every subject has an approved teacher yet. NEVER state a subject is or isn't bookable — direct users to the teachers page (bookable subjects show a green badge) or WhatsApp.
- Lessons are online or in person in Zurich, 50 minutes each.
- Every teacher is reviewed and approved by the Academigo team before going live.
- Email reminder ~24 hours before each lesson. Own platform: booking, credits, teacher session notes, reviews, .ics calendar download.

# CLIENTS
- Swiss students from primary school through Gymnasium and university. Goals: exam prep (e.g. Gymiprüfung, Matura), closing gaps, long-term support.

# PRICING (all CHF, one-time purchases, NO subscription)
- Academigo Starter: CHF 89 — 1 credit.
- Academigo Focus: CHF 425 — 5 credits (saves CHF 20), most popular.
- Academigo Excellence: CHF 790 — 10 credits (saves CHF 100), best value.
- 1 credit = 1 lesson (50 min). Credits never expire and pool across purchases. A credit is used when the lesson is completed.
- Payment: Visa, Mastercard, American Express, and TWINT — via Stripe.
- No free trial and no discount codes exist. Do not invent any.

# PROCESS
- Students: sign up → verify email → complete profile (level, subject, goals) → browse teachers → buy credits → book a 50-min slot in the teacher's calendar → the teacher confirms.
- Teachers: sign up → verify email → build profile (bio, subjects, CV, motivation letter, payout details) → admin review → once approved, set weekly availability and receive bookings.

# CANCELLATION & REFUNDS
- A confirmed lesson can be cancelled up to 24 hours before it starts (by student or teacher); the credit is returned. Later than that: not possible via the platform → WhatsApp for exceptions. Pending bookings can be cancelled any time.
- No automated money refund — timely cancellation returns a credit. Money-refund requests → WhatsApp.

# TEACHERS (earnings & levels)
- Three levels with rising pay and visibility: Junior (~CHF 30/lesson, entry level), Academigo Teacher (~CHF 45/lesson, "Academigo Certified"), Verified (up to CHF 60/lesson, priority listing).
- Exact promotion thresholds and rates are NOT settled — for precise numbers, tell the teacher to email omid@academigo.xyz (subject "Level promotion"). Do not state exact thresholds as fact.
- Payouts: earnings credited after marking a session complete; request a payout; paid via IBAN or TWINT.

# DOES NOT EXIST (never describe as a feature)
- Homework, quizzes, exercise generation, student progress tracking/XP/badges/hints/snapshots, in-app notification feed, recurring-lesson booking, subscriptions.

# CONTACT / ESCALATION
- Email: omid@academigo.xyz. WhatsApp: +41 78 693 68 98 (button below the chat).
- Escalate to WhatsApp for: refunds, account issues, changing/rescheduling a specific lesson, specific teacher availability, specific scheduling, billing disputes, technical issues, and exact teacher rates/thresholds. Never guess — hand off instead.`;

/** Structured FAQ mirror of faq.md (verified). Extend as needed. */
export const FAQS: { q: string; a: string; category: string }[] = [
  { category: "general", q: "What is Academigo?", a: "A Swiss academic tutoring platform where students find vetted teachers and book paid 1:1 lessons online or in person in Zurich." },
  { category: "general", q: "What languages is the platform in?", a: "German (default) and English." },
  { category: "general", q: "Is Academigo online or in person?", a: "Both — online, or in person in Zurich." },
  { category: "general", q: "How do I contact Academigo?", a: "Email omid@academigo.xyz or WhatsApp +41 78 693 68 98." },
  { category: "subjects", q: "What subjects does Academigo offer?", a: "A catalogue of 22 school subjects across STEM, languages, humanities, and creative subjects." },
  { category: "subjects", q: "Is subject X available to book now?", a: "Availability depends on whether an approved teacher currently teaches it; the teachers page shows a green badge. I can't confirm live availability — please check there or contact WhatsApp." },
  { category: "subjects", q: "Do you prepare for the Gymiprüfung or Matura?", a: "Yes, exam preparation such as the Gymiprüfung and Matura is a core use case." },
  { category: "pricing", q: "How much does it cost?", a: "Three one-time packages: Starter CHF 89 (1 credit), Focus CHF 425 (5 credits), Excellence CHF 790 (10 credits)." },
  { category: "pricing", q: "What is a credit?", a: "One credit equals one lesson of 50 minutes; it's used when the session is completed." },
  { category: "pricing", q: "Do credits expire?", a: "No — credits never expire and pool across purchases." },
  { category: "pricing", q: "Is there a subscription?", a: "No. All packages are one-time purchases." },
  { category: "pricing", q: "How do I pay?", a: "Credit/debit cards (Visa, Mastercard, American Express) or TWINT, via Stripe." },
  { category: "pricing", q: "Is there a free trial or discount code?", a: "No free trial and no discount codes. The only saving is per lesson on larger packages (Focus saves CHF 20, Excellence CHF 100)." },
  { category: "booking", q: "How long is a lesson?", a: "50 minutes." },
  { category: "booking", q: "How do I book a lesson?", a: "Log in, choose a teacher, pick a 50-minute slot in their calendar, and submit a request; the teacher confirms." },
  { category: "booking", q: "Can lessons be online?", a: "Yes; you join via the meeting link on your confirmed booking." },
  { category: "booking", q: "Will I get a reminder?", a: "Yes — an email reminder about 24 hours before the lesson." },
  { category: "booking", q: "Can I change teacher?", a: "Yes, you can book a different teacher for future lessons any time; to change the teacher on an existing booking, contact WhatsApp." },
  { category: "cancellation", q: "Can I cancel a lesson?", a: "A confirmed lesson can be cancelled up to 24 hours before it starts and the credit is returned; within 24 hours, contact WhatsApp." },
  { category: "cancellation", q: "Can I get my money back?", a: "There's no automated money refund; a timely cancellation returns a credit. For money refunds, contact WhatsApp." },
  { category: "account", q: "How do I sign up?", a: "Create an account with your email and password, choose student or teacher, and verify your email." },
  { category: "reviews", q: "Can I review my teacher?", a: "Yes — after a completed lesson you can leave a 1–5 star rating and an optional comment (one per booking)." },
  { category: "teacher", q: "How do I become a teacher?", a: "Sign up as a teacher, verify your email, build your profile (bio, subjects, CV, motivation letter, payout details), and submit for admin review." },
  { category: "teacher", q: "What qualifications do teachers need?", a: "Every teacher is reviewed and approved by the Academigo team before going live; a motivation letter is required and a CV can be uploaded. For specific requirements, contact WhatsApp." },
  { category: "teacher", q: "How much do teachers earn?", a: "Pay rises with level: about CHF 30/lesson at Junior, CHF 45 at Academigo Teacher, and up to CHF 60 at Verified. For exact current rates, email omid@academigo.xyz." },
  { category: "platform", q: "Do you offer homework, quizzes, or progress tracking?", a: "No — those aren't features of Academigo. I can help with tutoring, booking, credits, and teachers." },
];
