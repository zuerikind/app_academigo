/** Display order for Academigo subjects (matches supabase/seed.sql). */
export const SUBJECT_SLUGS = [
  "mathematics",
  "physics",
  "chemistry",
  "german",
  "french",
  "italian",
  "english",
  "spanish",
  "latin",
  "greek",
  "applied-mathematics",
  "computer-science",
  "biology",
  "history",
  "geography",
  "economics",
  "philosophy",
  "pedagogy-psychology",
  "religious-studies",
  "visual-arts",
  "music",
  "sports",
] as const;

export type SubjectSlug = (typeof SUBJECT_SLUGS)[number];

/** Slugs that are live on the platform (others are coming soon). */
export const ACTIVE_SUBJECT_SLUGS: readonly SubjectSlug[] = [
  "mathematics",
  "physics",
  "chemistry",
];
