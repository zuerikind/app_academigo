"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isValidAvatarFile, uploadAvatar } from "@/lib/storage/avatars";

export type TeacherActionState = { error?: string; success?: boolean };


export async function updateTeacherProfile(
  _prev: TeacherActionState,
  formData: FormData,
): Promise<TeacherActionState> {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!teacher) return { error: "Teacher record not found." };

  const subjectIds = formData.getAll("subjectIds") as string[];
  const languageChecked = formData.getAll("languageChecked") as string[];
  const languageOther = (formData.get("languageOther") as string) || "";
  const otherLangs = languageOther
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
  const languages = [...languageChecked, ...otherLangs];

  const offersOnline = formData.get("offersOnline") === "on";
  const offersInPerson = formData.get("offersInPerson") === "on";

  const avatarFile = formData.get("avatar");
  if (isValidAvatarFile(avatarFile)) {
    const { url, error: uploadError } = await uploadAvatar(
      supabase,
      profile.user_id,
      avatarFile,
    );
    if (uploadError) return { error: uploadError };
    if (url) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", profile.id);
      if (profileError) return { error: profileError.message };
    }
  }

  const { error: teacherError } = await supabase
    .from("teachers")
    .update({
      bio: formData.get("bio") as string,
      education: formData.get("education") as string,
      experience: formData.get("experience") as string,
      teaching_style: formData.get("teachingStyle") as string,
      offers_online: offersOnline,
      offers_in_person: offersInPerson,
      location: offersInPerson ? ((formData.get("location") as string) || null) : null,
      languages,
    })
    .eq("id", teacher.id);

  if (teacherError) return { error: teacherError.message };

  if (subjectIds.length > 0) {
    await supabase.from("teacher_subjects").delete().eq("teacher_id", teacher.id);
    await supabase.from("teacher_subjects").insert(
      subjectIds.map((subject_id) => ({ teacher_id: teacher.id, subject_id })),
    );
  }

  revalidatePath("/", "layout");
  revalidatePath("/[locale]/teacher/profile", "page");
  return { success: true };
}

export async function updateTeacherSettings(
  _prev: TeacherActionState,
  formData: FormData,
): Promise<TeacherActionState> {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const fullName = (formData.get("fullName") as string)?.trim();
  if (!fullName || fullName.length < 2) return { error: "Name is required." };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", profile.id);
  if (profileError) return { error: profileError.message };

  const payoutName = (formData.get("payoutName") as string)?.trim() || "";
  const payoutIban = (formData.get("payoutIban") as string)?.trim() || "";
  const payoutStreet = (formData.get("payoutStreet") as string)?.trim() || "";
  const payoutZip = (formData.get("payoutZip") as string)?.trim() || "";
  const payoutCity = (formData.get("payoutCity") as string)?.trim() || "";
  const payoutTwint = (formData.get("payoutTwint") as string)?.trim() || "";
  const addressParts = [payoutStreet, [payoutZip, payoutCity].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const payoutParts = [
    payoutName ? `Name: ${payoutName}` : null,
    payoutIban ? `IBAN: ${payoutIban}` : null,
    addressParts || null,
    payoutTwint ? `Twint: ${payoutTwint}` : null,
  ].filter(Boolean);
  const payoutInfo = payoutParts.length > 0 ? payoutParts.join("\n") : null;

  const defaultMeetLink = (formData.get("defaultMeetLink") as string)?.trim() || null;
  if (defaultMeetLink && !defaultMeetLink.startsWith("https://")) {
    return { error: "Meet link must be a valid HTTPS URL (must start with https://)." };
  }

  const { data: teacherRow } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!teacherRow) return { error: "Teacher record not found." };

  const { error: teacherError } = await supabase
    .from("teacher_private")
    .upsert({
      teacher_id: teacherRow.id,
      payout_info_placeholder: payoutInfo,
      default_meet_link: defaultMeetLink,
      updated_at: new Date().toISOString(),
    });
  if (teacherError) return { error: teacherError.message };

  revalidatePath("/", "layout");
  return { success: true };
}

