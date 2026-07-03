import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { EmailConfirmationEmail } from "@/emails/email-confirmation";
import { PasswordResetEmail } from "@/emails/password-reset";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
const FROM = process.env.RESEND_FROM_EMAIL ?? "Academigo <omid@academigo.xyz>";

export async function POST(req: NextRequest) {
  // Fail closed: without the shared secret this endpoint would be an open
  // mail relay through our Resend account.
  const secret = process.env.SUPABASE_AUTH_HOOK_SECRET;
  if (!secret) {
    console.error("[send-email] SUPABASE_AUTH_HOOK_SECRET not configured — refusing to send");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const email: string = body?.user?.email;
  const fullName: string | undefined = body?.user?.user_metadata?.full_name;
  const confirmationUrl: string = body?.email_data?.confirmation_url;
  const actionType: string = body?.email_data?.email_action_type;

  if (!email || !confirmationUrl) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (actionType === "signup" || actionType === "email_change_new") {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "E-Mail-Adresse bestätigen — Academigo",
      react: EmailConfirmationEmail({ confirmationUrl, fullName }),
    });
  } else if (actionType === "recovery") {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Passwort zurücksetzen — Academigo",
      react: PasswordResetEmail({ resetUrl: confirmationUrl, fullName }),
    });
  }

  return NextResponse.json({});
}
