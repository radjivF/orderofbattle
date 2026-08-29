import { formatRuleListItem, parseRuleText } from "@/lib/ruleText";

type Props = {
  text: string;
  label?: string;
  className?: string;
  itemClassName?: string;
};

const BODY_CLASS = "text-sm leading-relaxed";

/** Warscroll declare/effect copy — one layout for prose and multi-part lists. */
export function RuleText({
  text,
  label,
  className = "",
  itemClassName = "text-parchment-ink/75",
}: Props) {
  const parsed = parseRuleText(text);
  if (parsed.kind === "prose") {
    if (!parsed.text) {
      return null;
    }
    return (
      <div className={className}>
        <p className={`${BODY_CLASS} ${itemClassName}`}>
          {label ? <span className="text-sheet-muted">{label}</span> : null}
          {parsed.text}
        </p>
      </div>
    );
  }

  if (parsed.items.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {label ? (
        <p className={`${BODY_CLASS} ${itemClassName}`}>
          <span className="text-sheet-muted">{label}</span>
        </p>
      ) : null}
      {parsed.preface ? (
        <p
          className={`${BODY_CLASS} ${itemClassName} ${label ? "mt-1" : ""}`}
        >
          {parsed.preface}
        </p>
      ) : null}
      <ul
        className={`list-disc space-y-1.5 pl-5 ${BODY_CLASS} ${itemClassName} ${label || parsed.preface ? "mt-1" : ""}`}
      >
        {parsed.items.map((item) => (
          <RuleListItem key={item} text={item} />
        ))}
      </ul>
    </div>
  );
}

function RuleListItem({ text }: { text: string }) {
  const formatted = formatRuleListItem(text);
  if (formatted.title && formatted.body) {
    return (
      <li>
        <span className="font-semibold text-parchment-ink">
          {formatted.title}
        </span>
        : {formatted.body}
      </li>
    );
  }
  return <li>{formatted.plain}</li>;
}
