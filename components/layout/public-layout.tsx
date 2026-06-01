import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getSessionUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";

export async function PublicLayout({
  children,
  locale: raw,
  footerTagline,
}: {
  children: React.ReactNode;
  locale: string;
  footerTagline?: string;
}) {
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const user = await getSessionUser();
  const dict = getDictionary(locale);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white">
      <Navbar isAuthenticated={!!user} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} dict={dict} tagline={footerTagline} />
    </div>
  );
}
