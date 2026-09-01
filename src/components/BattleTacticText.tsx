import { splitBattleTacticText } from "@/engine/battleTacticText";

type Props = {
  text: string;
  stage?: string;
  className?: string;
  /** `sheet` = parchment cards; `play` = dark Play chrome. */
  tone?: "play" | "sheet";
};

export function BattleTacticText({
  text,
  stage,
  className,
  tone = "play",
}: Props) {
  const { name, body } = splitBattleTacticText(text);
  const hasTitle = Boolean(stage || name);
  const stageClass =
    tone === "sheet"
      ? "font-semibold uppercase tracking-wide text-sheet-muted"
      : "font-semibold uppercase tracking-wide text-parchment/55";
  const nameClass =
    tone === "sheet"
      ? "font-serif font-medium text-parchment-ink"
      : "font-serif font-medium text-parchment";
  const bodyClass =
    tone === "sheet"
      ? hasTitle
        ? "mt-1.5 leading-6 text-parchment-ink/80"
        : "leading-6 text-parchment-ink/80"
      : hasTitle
        ? "mt-1.5 leading-6 text-parchment/75"
        : "leading-6 text-parchment/75";

  return (
    <div className={className}>
      {hasTitle ? (
        <p>
          {stage ? (
            <span className={stageClass}>
              {stage}
              {name ? " · " : null}
            </span>
          ) : null}
          {name ? <strong className={nameClass}>{name}</strong> : null}
        </p>
      ) : null}
      {body ? <p className={bodyClass}>{body}</p> : null}
    </div>
  );
}
