import { notFound } from "next/navigation";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { SetHtmlLang } from "@/components/layout/set-html-lang";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, locales } from "@/lib/i18n/config";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const dict = getDictionary(raw);

  return (
    <LocaleProvider locale={raw} dict={dict}>
      <SetHtmlLang locale={raw} />
      {children}
    </LocaleProvider>
  );
}
