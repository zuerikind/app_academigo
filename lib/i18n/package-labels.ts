import type { Dictionary } from "@/messages/types";

export function getPackageName(dict: Dictionary, id: string): string {
  const tier = dict.pricing.tiers[id as keyof typeof dict.pricing.tiers];
  if (tier && "name" in tier) {
    return tier.name;
  }
  return id;
}
