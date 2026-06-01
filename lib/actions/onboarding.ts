"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActionLocale } from "@/lib/actions/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string };

const studentSchema = z.object({
  fullName: z.string().min(2),
  schoolLevel: z.string().min(1),
  learningGoal: z.string().min(1),
  preferredLanguage: z.string().min(1),
  preferredModality: z.enum(["online", "in_person", "both"]),
  preferredSubjectId: z.string().uuid(),
  notes: z.string().optional(),
});

export async function completeStudentOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const locale = await getActionLocale(formData);
  const dict = getDictionary(locale);
  const profile = await requireProfile();
  if (profile.role !== "student") {
    return { error: dict.errors.invalidAccountType };
  }

  const parsed = studentSchema.safeParse({
    fullName: formData.get("fullName"),
    schoolLevel: formData.get("schoolLevel"),
    learningGoal: formData.get("learningGoal"),
    preferredLanguage: formData.get("preferredLanguage"),
    preferredModality: formData.get("preferredModality"),
    preferredSubjectId: formData.get("preferredSubjectId"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: dict.student.onboarding.errors.required };
  }

  const supabase = await createClient();
  const data = parsed.data;

  await supabase
    .from("profiles")
    .update({ full_name: data.fullName, onboarding_completed: true })
    .eq("id", profile.id);

  const { data: existing } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("students")
      .update({
        school_level: data.schoolLevel,
        learning_goal: data.learningGoal,
        preferred_language: data.preferredLanguage,
        preferred_modality: data.preferredModality,
        preferred_subject_id: data.preferredSubjectId,
        notes: data.notes ?? null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("students").insert({
      profile_id: profile.id,
      school_level: data.schoolLevel,
      learning_goal: data.learningGoal,
      preferred_language: data.preferredLanguage,
      preferred_modality: data.preferredModality,
      preferred_subject_id: data.preferredSubjectId,
      notes: data.notes ?? null,
    });
  }

  revalidatePath("/", "layout");
  redirect(localizedPath(locale, "/student/dashboard"));
}

const teacherSchema = z.object({
  fullName: z.string().min(2),
  bio: z.string().min(20),
  education: z.string().min(2),
  experience: z.string().min(2),
  teachingStyle: z.string().min(2),
  offersOnline: z.coerce.boolean(),
  offersInPerson: z.coerce.boolean(),
  location: z.string().optional(),
  languageChecked: z.array(z.string()).default([]),
  languageOther: z.string().optional(),
  payoutName: z.string().optional(),
  payoutIban: z.string().optional(),
  payoutStreet: z.string().optional(),
  payoutZip: z.string().optional(),
  payoutCity: z.string().optional(),
  payoutTwint: z.string().optional(),
  subjectIds: z.array(z.string().uuid()).min(1),
  defaultMeetLink: z
    .string()
    .url("Meet link must be a valid HTTPS URL")
    .optional()
    .or(z.literal("")),
});

export async function completeTeacherOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const locale = await getActionLocale(formData);
  const dict = getDictionary(locale);
  const profile = await requireProfile();
  if (profile.role !== "teacher") {
    return { error: dict.errors.invalidAccountType };
  }

  const subjectIds = formData.getAll("subjectIds") as string[];
  const languageChecked = formData.getAll("languageChecked") as string[];

  const parsed = teacherSchema.safeParse({
    fullName: formData.get("fullName"),
    bio: formData.get("bio"),
    education: formData.get("education"),
    experience: formData.get("experience"),
    teachingStyle: formData.get("teachingStyle"),
    offersOnline: formData.get("offersOnline") === "on",
    offersInPerson: formData.get("offersInPerson") === "on",
    location: formData.get("location") || undefined,
    languageChecked,
    languageOther: formData.get("languageOther") as string || undefined,
    payoutName: formData.get("payoutName") as string || undefined,
    payoutIban: formData.get("payoutIban") as string || undefined,
    payoutStreet: formData.get("payoutStreet") as string || undefined,
    payoutZip: formData.get("payoutZip") as string || undefined,
    payoutCity: formData.get("payoutCity") as string || undefined,
    payoutTwint: formData.get("payoutTwint") as string || undefined,
    subjectIds,
    defaultMeetLink: (formData.get("defaultMeetLink") as string) || undefined,
  });

  if (!parsed.success) {
    return { error: dict.teacher.onboarding.errors.required };
  }

  const supabase = await createClient();
  const data = parsed.data;
  const otherLangs = data.languageOther
    ? data.languageOther.split(",").map((l) => l.trim()).filter(Boolean)
    : [];
  const languages = [...data.languageChecked, ...otherLangs];
  const addressParts = [data.payoutStreet, [data.payoutZip, data.payoutCity].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const payoutInfo = [
    data.payoutName ? `Name: ${data.payoutName}` : null,
    data.payoutIban ? `IBAN: ${data.payoutIban}` : null,
    addressParts ? `Adresse: ${addressParts}` : null,
    data.payoutTwint ? `Twint: ${data.payoutTwint}` : null,
  ].filter(Boolean).join("\n") || null;

  let avatarUrl = profile.avatar_url;

  const avatarFile = formData.get("avatar") as File | null;
  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split(".").pop() ?? "jpg";
    const path = `${profile.user_id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = urlData.publicUrl;
    }
  }

  await supabase
    .from("profiles")
    .update({
      full_name: data.fullName,
      avatar_url: avatarUrl,
      onboarding_completed: true,
    })
    .eq("id", profile.id);

  const { data: existing } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  let teacherId = existing?.id;

  const teacherPayload = {
    bio: data.bio,
    education: data.education,
    experience: data.experience,
    teaching_style: data.teachingStyle,
    offers_online: data.offersOnline,
    offers_in_person: data.offersInPerson,
    location: data.offersInPerson ? data.location ?? null : null,
    languages,
    payout_info_placeholder: payoutInfo ?? null,
    default_meet_link: data.defaultMeetLink || null,
    is_approved: false,
  };

  if (existing) {
    await supabase.from("teachers").update(teacherPayload).eq("id", existing.id);
    teacherId = existing.id;
  } else {
    const { data: created } = await supabase
      .from("teachers")
      .insert({ profile_id: profile.id, ...teacherPayload })
      .select("id")
      .single();
    teacherId = created?.id;
  }

  if (teacherId) {
    await supabase.from("teacher_subjects").delete().eq("teacher_id", teacherId);
    await supabase.from("teacher_subjects").insert(
      data.subjectIds.map((subject_id) => ({ teacher_id: teacherId!, subject_id })),
    );
  }

  revalidatePath("/", "layout");
  redirect(localizedPath(locale, "/teacher/dashboard"));
}
