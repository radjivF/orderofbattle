import { formatRuleListItem, parseRuleText } from "@/lib/ruleText";
import { HighlightedText } from "./HighlightedText";

type Props = {
  text: string;
  label?: string;
  className?: string;
  itemClassName?: string;
  highlight?: string;
};

const BODY_CLASS = "text-sm leading-relaxed";
const LABEL_CLASS = "font-semibold text-sheet-muted";

/** Warscroll declare/effect copy — one layout for prose and multi-part lists. */
export function RuleText({
  text,
  label,
  className = "",
  itemClassName = "text-parchment-ink/75",
  highlight,
}: Props) {
  const parsed = parseRuleText(text);
  if (parsed.kind === "prose") {
    if (!parsed.text) {
      return null;
    }
    return (
      <div className={className}>
        <p className={`${BODY_CLASS} ${itemClassName}`}>
          {label ? <span className={LABEL_CLASS}>{label}</span> : null}
          <HighlightedText text={parsed.text} query={highlight} />
        </p>
      </div>
    );
  }

  if (parsed.items.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {label || parsed.preface ? (
        <p className={`${BODY_CLASS} ${itemClassName}`}>
          {label ? <span className={LABEL_CLASS}>{label}</span> : null}
          {parsed.preface ? (
            <HighlightedText text={parsed.preface} query={highlight} />
          ) : null}
        </p>
      ) : null}
      <ul
        className={`list-disc space-y-1.5 pl-5 ${BODY_CLASS} ${itemClassName} ${label || parsed.preface ? "mt-1" : ""}`}
      >
        {parsed.items.map((item) => (
          <RuleListItem key={item} text={item} highlight={highlight} />
        ))}
      </ul>
    </div>
  );
}

function RuleListItem({
  text,
  highlight,
}: {
  text: string;
  highlight?: string;
}) {
  const formatted = formatRuleListItem(text);
  if (formatted.title && formatted.body) {
    return (
      <li>
        <span className="font-semibold text-parchment-ink">
          <HighlightedText text={formatted.title} query={highlight} />
        </span>
        : <HighlightedText text={formatted.body} query={highlight} />
      </li>
    );
  }
  return (
    <li>
      <HighlightedText text={formatted.plain} query={highlight} />
    </li>
  );
}
