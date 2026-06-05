import { notFound, redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { updatePassword } from "@/lib/actions/auth";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { createClient } from "@/lib/supabase/server";
import { noIndexMetadata } from "@/lib/seo/metadata";

export const metadata = noIndexMetadata;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function UpdatePasswordPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = getDictionary(raw);

  // Session guard: use createClient directly (NOT requireProfile which redirects to /login)
  // Update-password requires redirect to /forgot-password if no recovery session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(localizedPath(locale, "/forgot-password"));
  }

  const t = dict.auth.updatePassword;

  return (
    <AuthShell
      locale={locale}
      dict={dict}
      title={t.title}
      description={t.subtitle}
      switchHref={localizedPath(locale, "/login")}
      switchPrompt=""
      switchCta={dict.auth.forgotPassword.backToLogin}
      asideEyebrow={dict.home.portal.authAside.eyebrow}
      asideTitle={dict.home.portal.authAside.title}
      asideBody={dict.home.portal.authAside.body}
    >
      <UpdatePasswordForm action={updatePassword} />
    </AuthShell>
  );
}
