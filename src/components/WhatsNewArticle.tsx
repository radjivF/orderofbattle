import { WHATS_NEW_ITEMS } from "@/lib/whatsNew";
import { ContentDoc } from "./ContentDoc";

type Props = {
  items?: readonly string[];
};

export function WhatsNewArticle({ items = WHATS_NEW_ITEMS }: Props) {
  return (
    <ContentDoc
      kicker="Updates"
      title="What's new in Order of Battle"
      updated="3 September 2026"
      crumbs={[
        { href: "/", label: "Home" },
        { href: "/updates", label: "What's new" },
      ]}
    >
      <p>
        New in the army builder. Battle record, and fury for Scourge.
      </p>

      {items.length === 0 ? (
        <p>No updates have been published yet.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </ContentDoc>
  );
}
