import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { StartListCta } from "@/components/StartListCta";
import { PATH_TO_GLORY_FAQS, PATH_TO_GLORY_HOW_TO_STEPS } from "@/lib/geoContent";
import {
  articleNode,
  breadcrumbNode,
  faqPageNode,
  howToNode,
  pageGraph,
} from "@/lib/jsonLd";
import {
  PATH_TO_GLORY_GUIDE_DATE,
  PATH_TO_GLORY_GUIDE_DESCRIPTION,
  PATH_TO_GLORY_GUIDE_PATH,
  PATH_TO_GLORY_GUIDE_TITLE,
  PATH_TO_GLORY_GUIDE_UPDATED,
} from "@/lib/pathToGloryGuide";
import { sitePath } from "@/lib/site";

export const metadata: Metadata = {
  title: PATH_TO_GLORY_GUIDE_TITLE,
  description: PATH_TO_GLORY_GUIDE_DESCRIPTION,
  keywords: [
    "Path to Glory Age of Sigmar",
    "Path to Glory army builder",
    "AoS Path to Glory list",
    "Anvil of Apotheosis builder",
    "Age of Sigmar campaign list",
  ],
  alternates: { canonical: PATH_TO_GLORY_GUIDE_PATH },
  openGraph: {
    title: PATH_TO_GLORY_GUIDE_TITLE,
    description: PATH_TO_GLORY_GUIDE_DESCRIPTION,
    type: "article",
  },
};

export default function PathToGloryGuidePage() {
  const url = sitePath(PATH_TO_GLORY_GUIDE_PATH);
  return (
    <>
      <JsonLd
        data={pageGraph([
          articleNode({
            url,
            headline: PATH_TO_GLORY_GUIDE_TITLE,
            description: PATH_TO_GLORY_GUIDE_DESCRIPTION,
            dateModified: PATH_TO_GLORY_GUIDE_DATE,
          }),
          howToNode(url, {
            name: "How to start a Path to Glory army list in Order of Battle",
            description:
              "Build a Path to Glory campaign list in Order of Battle: faction, battlepacks, 1,000-point cap, then campaign extras on units.",
            steps: PATH_TO_GLORY_HOW_TO_STEPS,
          }),
          faqPageNode(url, PATH_TO_GLORY_FAQS),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: "Path to Glory", path: PATH_TO_GLORY_GUIDE_PATH },
          ]),
        ])}
      />
      <ContentDoc
        kicker="Guide"
        title="Path to Glory army lists in Age of Sigmar"
        updated={PATH_TO_GLORY_GUIDE_UPDATED}
        updatedDateTime={PATH_TO_GLORY_GUIDE_DATE}
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/guides", label: "Guides" },
          { href: PATH_TO_GLORY_GUIDE_PATH, label: "Path to Glory" },
        ]}
      >
        <p>
          Path to Glory is Games Workshop&apos;s campaign format for Age of
          Sigmar 4th edition. You grow a roster over games: paths, scars, extra
          kit, a custom hero if you want one. Order of Battle builds those
          lists in the browser. Free, unofficial, no account. The list stays on
          your device.
        </p>
        <StartListCta />

        <h2>What Path to Glory is</h2>
        <p className="mt-3">
          Matched play is a 2,000-point one-off game. Path to Glory is the same
          faction, a smaller starting size, and extra campaign fields on units.
          Official battlepacks include Ascension, Ravaged Coast, and Blighted
          Wilds. Confirm the pack and points with the book you are using.
        </p>

        <h2>What this builder does</h2>
        <p className="mt-3">
          Pick a faction and Path to Glory in the new-list sheet. Tick
          battlepacks. Start at 1,000 points by default. Units can take a path,
          renown, battle wounds, and scars. An Anvil of Apotheosis hero is a
          regiment leader. Artefacts and heroic traits stick to the hero who
          has them. Wizards learn spells one by one instead of taking a whole
          lore. You can import a Path to Glory list from New Recruit or the Age
          of Sigmar app. Play mode still tracks wounds and phase abilities.
        </p>
        <p>
          It does not replace the campaign book. Quest tables, territory, and
          glory spend still live on paper.
        </p>

        <h2>Path to Glory vs matched play vs Spearhead</h2>
        <table>
          <thead>
            <tr>
              <th>In this app</th>
              <th>Path to Glory</th>
              <th>Matched play</th>
              <th>Spearhead</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Default cap</td>
              <td>1,000 points</td>
              <td>2,000 points</td>
              <td>Fixed box</td>
            </tr>
            <tr>
              <td>Season extras</td>
              <td>Battlepacks</td>
              <td>Scourge season and battle tactics</td>
              <td>Spearhead rules</td>
            </tr>
            <tr>
              <td>On the unit</td>
              <td>Path, renown, wounds, scars, Anvil</td>
              <td>Enhancements, season tables</td>
              <td>Box extras</td>
            </tr>
          </tbody>
        </table>

        <h2>How to start a Path to Glory list</h2>
        <ol>
          <li>Open My lists. Tap New list.</li>
          <li>Pick a faction.</li>
          <li>In Army, choose Path to Glory.</li>
          <li>
            Tick the battlepacks you are using. Ascension is on by default.
          </li>
          <li>
            Name the list. 1,000 points is the default cap. Change it if your
            campaign uses another size.
          </li>
          <li>
            Add a general and regiments the usual way. Campaign extras sit on
            the unit card.
          </li>
        </ol>
        <StartListCta layout="inline" />

        <h2>Anvil of Apotheosis</h2>
        <p className="mt-3">
          Anvil of Apotheosis is the custom-hero path in Path to Glory. In this
          app the Anvil hero is a regiment leader. Open Go to forge on that
          hero. Picks that only change the warscroll (Fly, extra attacks, a new
          weapon) land on the datasheet. Real abilities stay on the play phase
          list.
        </p>

        <h2>Magic</h2>
        <p className="mt-3">
          Wizards learn spells one by one. Manifestations work the same. You do
          not pick a full lore the way matched play does.
        </p>

        <h2>Import</h2>
        <p className="mt-3">
          Paste or import a Path to Glory export from New Recruit or the Age of
          Sigmar app. Battlepacks and Anvil picks come across when the text
          includes them.
        </p>

        <h2>At the table</h2>
        <p className="mt-3">
          Play mode still tracks wounds, lasting magic, and abilities by phase.
          Start of turn and end of turn tabs show when the list has those
          abilities.
        </p>

        <h2>Official check</h2>
        <p className="mt-3">
          Order of Battle is not a Games Workshop product. Points and rules in
          the app are helpers. Use the Path to Glory book and your
          campaign&apos;s house rules before you play.
        </p>

        {PATH_TO_GLORY_FAQS.map((item) => (
          <section key={item.question}>
            <h2>{item.question}</h2>
            <p className="mt-3">{item.answer}</p>
          </section>
        ))}

        <p>
          <Link href="/guides/how-to-build-an-age-of-sigmar-army-list">
            How to build a matched-play list
          </Link>
          {" · "}
          <Link href="/guides/free-age-of-sigmar-army-builder">
            Free army builder
          </Link>
          {" · "}
          <Link href="/faq">FAQ</Link>
        </p>
      </ContentDoc>
    </>
  );
}
