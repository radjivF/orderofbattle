import { parseRuleText } from "@/lib/ruleText";

type Props = {
  text: string;
  label?: string;
  className?: string;
  itemClassName?: string;
};

/** Warscroll declare/effect copy with readable bullet lists. */
export function RuleText({
  text,
  label,
  className = "",
  itemClassName = "text-parchment-ink/75",
}: Props) {
  const blocks = parseRuleText(text);
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        const showLabel = Boolean(label) && index === 0;
        if (block.kind === "prose") {
          return (
            <p
              key={`prose-${index}`}
              className={`leading-relaxed ${index > 0 ? "mt-2" : ""} ${itemClassName}`}
            >
              {showLabel ? (
                <span className="text-sheet-muted">{label}</span>
              ) : null}
              {block.text}
            </p>
          );
        }

        return (
          <div key={`bullets-${index}`} className={index > 0 ? "mt-2" : ""}>
            {showLabel ? (
              <p className={`leading-relaxed ${itemClassName}`}>
                <span className="text-sheet-muted">{label}</span>
              </p>
            ) : null}
            <ul
              className={`list-disc space-y-1.5 pl-5 leading-relaxed ${showLabel ? "mt-1" : ""} ${itemClassName}`}
            >
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
