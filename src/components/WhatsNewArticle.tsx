import { WHATS_NEW_ITEMS } from "@/lib/whatsNew";
import { PATH_TO_GLORY_GUIDE_PATH } from "@/lib/pathToGloryGuide";
import { ContentDoc } from "./ContentDoc";
import Link from "next/link";

type Props = {
  items?: readonly string[];
};

export function WhatsNewArticle({ items = WHATS_NEW_ITEMS }: Props) {
  return (
    <ContentDoc
      kicker="Updates"
      title="What's new in Order of Battle"
      updated="31 August 2026"
      updatedDateTime="2026-08-31"
      crumbs={[
        { href: "/", label: "Home" },
        { href: "/updates", label: "What's new" },
      ]}
    >
      <p>
        Path to Glory campaign lists are in this Age of Sigmar army builder.
        Battlepacks, Anvil of Apotheosis, paths, learned spells. Play mode still
        tracks wounds and phase abilities.{" "}
        <Link href={PATH_TO_GLORY_GUIDE_PATH}>Path to Glory guide</Link>.
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
