import { splitBattleTacticText } from "@/engine/battleTacticText";

type Props = {
  text: string;
  stage?: string;
  className?: string;
};

export function BattleTacticText({ text, stage, className }: Props) {
  const { name, body } = splitBattleTacticText(text);
  const hasTitle = Boolean(stage || name);
  return (
    <div className={className}>
      {hasTitle ? (
        <p>
          {stage ? (
            <span className="font-semibold uppercase tracking-wide text-parchment/55">
              {stage}
              {name ? " · " : null}
            </span>
          ) : null}
          {name ? (
            <strong className="font-serif font-medium text-parchment">
              {name}
            </strong>
          ) : null}
        </p>
      ) : null}
      {body ? (
        <p
          className={
            hasTitle
              ? "mt-1.5 leading-6 text-parchment/75"
              : "leading-6 text-parchment/75"
          }
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}
