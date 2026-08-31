import { splitBattleTacticText } from "@/engine/battleTacticText";

type Props = {
  text: string;
  stage?: string;
  className?: string;
};

export function BattleTacticText({ text, stage, className }: Props) {
  const { name, body } = splitBattleTacticText(text);
  return (
    <p className={className}>
      {stage ? (
        <span className="font-semibold uppercase tracking-wide text-parchment/55">
          {stage} ·{" "}
        </span>
      ) : null}
      {name ? (
        <strong className="font-serif font-medium text-parchment">{name}</strong>
      ) : null}
      {name && body ? ": " : null}
      {body}
    </p>
  );
}
