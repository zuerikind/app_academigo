import { Badge } from "@/components/ui/badge";
import type { SubjectDisplayItem } from "@/lib/i18n/subject-catalog";

type Props = {
  items: SubjectDisplayItem[];
  availableLabel: string;
  comingSoonLabel: string;
  /** Compact rows without group headings (e.g. hero). */
  compact?: boolean;
};

export function HomeSubjectTags({
  items,
  availableLabel,
  comingSoonLabel,
  compact = false,
}: Props) {
  const available = items.filter((s) => !s.comingSoon);
  const comingSoon = items.filter((s) => s.comingSoon);

  if (compact) {
    return (
      <ul className="flex flex-wrap justify-center gap-2">
        {items.map(({ slug, label, comingSoon: soon }) => (
          <li key={slug}>
            <Badge variant={soon ? "muted" : "verified"} size="sm">
              {label}
            </Badge>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-8">
      {available.length > 0 ? (
        <div>
          <p className="text-meta mb-4">{availableLabel}</p>
          <ul className="flex flex-wrap gap-2">
            {available.map(({ slug, label }) => (
              <li key={slug}>
                <Badge variant="verified" size="sm">
                  {label}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {comingSoon.length > 0 ? (
        <div>
          <p className="text-meta mb-4">{comingSoonLabel}</p>
          <ul className="flex flex-wrap gap-2">
            {comingSoon.map(({ slug, label }) => (
              <li key={slug}>
                <Badge variant="muted" size="sm">
                  {label}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
