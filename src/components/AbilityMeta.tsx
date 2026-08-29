import { formatCastValue } from "@/lib/abilityUi";

const BADGE_CLASS =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-aether/55 bg-aether/10 px-1.5 text-sm font-bold tabular-nums leading-none text-aether";

type BadgeProps = {
  value: string;
  /** Screen-reader label prefix — Cast or Chant. */
  kind?: "Cast" | "Chant";
};

export function CastValueBadge({ value, kind = "Cast" }: BadgeProps) {
  const formatted = formatCastValue(value);
  if (!formatted) {
    return null;
  }
  return (
    <span className={BADGE_CLASS} aria-label={`${kind} ${formatted}`}>
      {formatted}
    </span>
  );
}

type LaunchMetaProps = {
  castingValue?: string;
  chantingValue?: string;
  prayer?: boolean;
  className?: string;
};

/** Play-mode launch row — "Launch · 6+" with circled cast/chant value. */
export function LaunchMeta({
  castingValue,
  chantingValue,
  prayer = false,
  className = "",
}: LaunchMetaProps) {
  const value = prayer ? chantingValue : castingValue;
  const formatted = value ? formatCastValue(value) : "";
  const fallback = prayer ? "Prayer" : "Spell";

  return (
    <div
      className={`flex shrink-0 items-center justify-end gap-1.5 text-xs font-semibold tracking-wide uppercase text-aether ${className}`.trim()}
    >
      <span>Launch</span>
      <span className="text-aether/60" aria-hidden>
        ·
      </span>
      {formatted ? (
        <CastValueBadge value={value!} kind={prayer ? "Chant" : "Cast"} />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  );
}

type MetaProps = {
  keywords?: string;
  cpCost?: number | null;
  castingValue?: string;
  chantingValue?: string;
  className?: string;
};

/** Ability header chips — keywords/CP text plus circled cast or chant values. */
export function AbilityMeta({
  keywords,
  cpCost,
  castingValue,
  chantingValue,
  className = "",
}: MetaProps) {
  const textParts = [
    keywords?.trim(),
    cpCost != null ? `${cpCost} CP` : "",
  ].filter(Boolean);
  const castBadge = castingValue ? (
    <CastValueBadge value={castingValue} kind="Cast" />
  ) : null;
  const chantBadge = chantingValue ? (
    <CastValueBadge value={chantingValue} kind="Chant" />
  ) : null;
  const badges = [castBadge, chantBadge].filter(Boolean);

  if (textParts.length === 0 && badges.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-end gap-1.5 ${className}`.trim()}
    >
      {textParts.map((part, index) => (
        <span key={part} className="contents">
          {index > 0 ? (
            <span className="text-sm text-sheet-muted/60" aria-hidden>
              ·
            </span>
          ) : null}
          <span className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
            {part}
          </span>
        </span>
      ))}
      {textParts.length > 0 && badges.length > 0 ? (
        <span className="text-sm text-sheet-muted/60" aria-hidden>
          ·
        </span>
      ) : null}
      {badges}
    </div>
  );
}
