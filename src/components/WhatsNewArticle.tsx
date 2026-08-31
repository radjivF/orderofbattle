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
      updated="31 August 2026"
      crumbs={[
        { href: "/", label: "Home" },
        { href: "/updates", label: "What's new" },
      ]}
    >
      <p>
        Fixes in this Age of Sigmar army builder release. Play mode and list
        tools that were easy to miss at the table.
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
