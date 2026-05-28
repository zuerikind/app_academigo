import type { Dictionary } from "@/messages/types";

const packageKeys = {
  single: "single",
  pack5: "pack5",
  pack10: "pack10",
  platform: "platform",
} as const;

export function getPackageName(dict: Dictionary, id: string): string {
  const key = id as keyof typeof packageKeys;
  const packages = dict.pricing.packages;
  if (key in packages) {
    return packages[key as keyof typeof packages];
  }
  return id;
}
