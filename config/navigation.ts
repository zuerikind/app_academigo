import type { Locale } from "@/lib/i18n/config";
import type { IconName } from "@/lib/icons";
import { localizedPath } from "@/lib/i18n/path";
import type { Dictionary } from "@/messages/types";

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
};

export function getPublicNav(dict: Dictionary, locale: Locale) {
  return [
    { label: dict.nav.teachers, href: localizedPath(locale, "/teachers") },
    { label: dict.nav.subjects, href: localizedPath(locale, "/subjects") },
    { label: dict.nav.pricing, href: localizedPath(locale, "/pricing") },
    { label: dict.nav.about, href: localizedPath(locale, "/about") },
  ] as const;
}

export function getStudentNav(dict: Dictionary, locale: Locale): NavItem[] {
  return [
    {
      label: dict.nav.student.dashboard,
      href: localizedPath(locale, "/student/dashboard"),
      icon: "layoutDashboard",
    },
    {
      label: dict.nav.student.findTeachers,
      href: localizedPath(locale, "/student/teachers"),
      icon: "users",
    },
    {
      label: dict.nav.student.bookings,
      href: localizedPath(locale, "/student/bookings"),
      icon: "calendar",
    },
    {
      label: dict.nav.student.packages,
      href: localizedPath(locale, "/student/packages"),
      icon: "package",
    },
    {
      label: dict.nav.student.settings,
      href: localizedPath(locale, "/student/settings"),
      icon: "settings",
    },
  ];
}

export function getTeacherNav(dict: Dictionary, locale: Locale): NavItem[] {
  return [
    {
      label: dict.nav.teacher.dashboard,
      href: localizedPath(locale, "/teacher/dashboard"),
      icon: "layoutDashboard",
    },
    {
      label: dict.nav.teacher.profile,
      href: localizedPath(locale, "/teacher/profile"),
      icon: "user",
    },
    {
      label: dict.nav.teacher.availability,
      href: localizedPath(locale, "/teacher/availability"),
      icon: "calendar",
    },
    {
      label: dict.nav.teacher.bookings,
      href: localizedPath(locale, "/teacher/bookings"),
      icon: "book",
    },
    {
      label: dict.nav.teacher.settings,
      href: localizedPath(locale, "/teacher/settings"),
      icon: "settings",
    },
  ];
}

export function getAdminNav(dict: Dictionary, locale: Locale): NavItem[] {
  return [
    {
      label: dict.admin.nav.dashboard,
      href: localizedPath(locale, "/admin/dashboard"),
      icon: "layoutDashboard",
    },
    {
      label: dict.admin.nav.teachers,
      href: localizedPath(locale, "/admin/teachers"),
      icon: "users",
    },
    {
      label: dict.admin.nav.students,
      href: localizedPath(locale, "/admin/students"),
      icon: "user",
    },
    {
      label: dict.admin.nav.bookings,
      href: localizedPath(locale, "/admin/bookings"),
      icon: "calendar",
    },
    {
      label: dict.admin.nav.promotions,
      href: localizedPath(locale, "/admin/promotions"),
      icon: "award",
    },
    {
      label: dict.admin.nav.payouts,
      href: localizedPath(locale, "/admin/payouts"),
      icon: "coins",
    },
  ];
}
