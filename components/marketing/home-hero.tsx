"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { localizedPath } from "@/lib/i18n/path";

export function HomeHero() {
  const { locale, dict } = useI18n();
  const t = dict.home;
  const c = dict.common;
  const reduced = useReducedMotion();

  const fade = (delay = 0) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1] as const,
            delay,
          },
        };

  return (
    <section className="relative isolate overflow-hidden bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(80%_60%_at_85%_-10%,rgba(43,85,133,0.06),transparent_60%)]"
      />
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-12 lg:gap-14 lg:py-32">
          {/* Headline column */}
          <motion.div {...fade(0)} className="lg:col-span-7">
            <p className="text-meta-brand inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-px w-6 bg-[color:var(--brand)]/45"
              />
              {t.badge}
            </p>

            <h1 className="text-hero mt-7 max-w-2xl text-academy-navy">
              {t.title}{" "}
              <span className="text-[color:var(--brand-deep)]">
                {t.titleHighlight}
              </span>
            </h1>

            <p className="text-lead mt-6 max-w-lg">{t.subtitle}</p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button
                href={siteConfig.links.consultation}
                variant="primary"
                size="lg"
                shape="pill"
                external
              >
                {c.ctaConsultation}
              </Button>
              <Button
                href={localizedPath(locale, "/teachers")}
                variant="secondary"
                size="lg"
                shape="pill"
              >
                {c.ctaViewTeachers}
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.7} />
              </Button>
            </div>

            {/* Quiet credentials row */}
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-x-8 gap-y-1 border-t border-academy-line pt-7">
              <Stat
                value="10+"
                caption={t.trust.experience.replace(/[0-9+]+\s*/, "")}
              />
              <Stat value="3" caption={t.trust.subjects.split(":")[0]} />
              <Stat value="ZH" caption={t.trust.locations} />
            </dl>
          </motion.div>

          {/* Side editorial panel */}
          <motion.div {...fade(0.08)} className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-[18px] border border-academy-line bg-white shadow-card">
              {/* hairline header */}
              <div className="flex items-center justify-between border-b border-academy-line px-5 py-3">
                <p className="text-meta">{t.approach.eyebrow}</p>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-academy-slate">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand)]"
                  />
                  Academigo · 2026
                </span>
              </div>

              <div className="px-6 py-7">
                <h2 className="font-display text-[20px] font-semibold leading-snug tracking-[-0.018em] text-academy-navy">
                  {t.approach.title}
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-academy-slate">
                  {t.approach.body}
                </p>
                <ul className="mt-6 divide-y divide-academy-line-soft text-[13.5px]">
                  {[t.trust.subjects, t.trust.platform, t.trust.support].map(
                    (line, idx) => (
                      <li
                        key={line}
                        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <span className="mt-[3px] font-display text-[11px] font-semibold tracking-tight text-[color:var(--brand)] text-numeric">
                          0{idx + 1}
                        </span>
                        <span className="text-academy-navy">{line}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              {/* footer tile — Apple Wallet-style strip */}
              <div className="flex items-center justify-between gap-3 border-t border-academy-line bg-academy-paper-soft px-5 py-3">
                <p className="text-[12px] text-academy-slate-muted">
                  {t.featuredTeachersDesc}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, caption }: { value: string; caption: string }) {
  return (
    <div>
      <dt className="font-display text-[22px] font-semibold leading-none tracking-tight text-academy-navy text-numeric">
        {value}
      </dt>
      <dd className="mt-2 text-[12px] leading-snug text-academy-slate-muted">
        {caption}
      </dd>
    </div>
  );
}
