import Link from "next/link";
import { isLocale, type Locale, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function VerifyEmailPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? (raw as Locale) : defaultLocale;
  const dict = getDictionary(locale);
  const t = dict.auth.verifyEmail;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-[16px] border border-[color:var(--academy-line)] bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-[color:var(--academy-navy)]">
            {t.title}
          </h1>
          <p className="text-[color:var(--academy-slate)]">{t.subtitle}</p>
        </div>
        <p className="text-center text-sm text-[color:var(--academy-slate)]">
          {t.instruction}
        </p>
        <p className="text-center text-xs text-[color:var(--academy-slate)]">
          {t.spam}
        </p>
        <div className="text-center">
          <Link
            href={localizedPath(locale, "/login")}
            className="text-sm text-[color:var(--brand-deep)] hover:underline"
          >
            {t.backToLogin}
          </Link>
        </div>
      </div>
    </main>
  );
}
