import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { articleNode, breadcrumbNode, pageGraph } from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

const title = "Age of Sigmar wound tracker and table companion";
const description =
  "Play mode in Order of Battle: track wounds, lasting spells and prayers, and abilities by phase during your Age of Sigmar game. Free wound tracker on your phone.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Age of Sigmar wound tracker",
    "AoS table companion",
    "free Age of Sigmar wound tracker",
    "Age of Sigmar Play mode",
    "track wounds AoS",
  ],
  alternates: { canonical: "/play" },
  openGraph: { title, description, type: "article" },
};

export default function PlayPage() {
  const url = sitePath("/play");
  return (
    <>
      <JsonLd
        data={pageGraph([
          articleNode({ url, headline: title, description }),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Play", path: "/play" },
          ]),
        ])}
      />
      <ContentDoc
        kicker="Feature"
        title="Age of Sigmar wound tracker and table companion"
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/play", label: "Play" },
        ]}
      >
        <p>
          Play mode is the part players love. Build the list in Order of Battle,
          then open Play to track wounds, lasting spells and prayers, and
          abilities by phase. Free wound tracker and table companion on your
          phone.
        </p>

        <h2>What Play mode does</h2>
        <p className="mt-3">
          Play mode turns your list into a live scoreboard. Track the fight
          without flipping warscrolls all night.
        </p>
        <ul>
          <li>
            <strong>Wound tracking</strong>: Adjust health on every unit
            mid-game. Models, damage, and battle damage at a glance.
          </li>
          <li>
            <strong>Lasting spells and prayers</strong>: Mark which unit has the
            lasting buff. See it again in combat when it matters.
          </li>
          <li>
            <strong>Abilities by phase</strong>: Hero, movement, shooting, charge,
            combat, end of turn. Only what that phase needs. No scrolling through
            every ability.
          </li>
        </ul>

        <h2>How to use Play mode</h2>
        <ol>
          <li>
            Build a list in <Link href="/dashboard">My lists</Link>.
          </li>
          <li>
            Open that list and tap <strong>Play</strong>.
          </li>
          <li>Track wounds on units as damage happens.</li>
          <li>Mark lasting spells or prayers on the affected units.</li>
          <li>Tap the phase button to filter abilities.</li>
          <li>Reset wound totals or the full battle state when the game ends.</li>
        </ol>
        <p>
          Play mode is optimized for phones. Hold the device at the table and
          update the list in real time.
        </p>

        <h2>Why wound tracking matters</h2>
        <p className="mt-3">
          Age of Sigmar units can take many wounds. Tracking that on paper or in
          your head gets messy. Play mode shows health for every unit, all in one
          place. You and your opponent see the damage instantly.
        </p>
        <p>
          Mid-game, you remember which hero took 3 wounds and which regiment is
          down to 6 models. No guessing.
        </p>

        <h2>Lasting spells and prayers</h2>
        <p className="mt-3">
          Some spells and prayers last until your next hero phase or the end of
          the turn. In the heat of combat, it&apos;s easy to forget which unit has
          the buff. Play mode lets you mark the unit. When the combat phase comes
          around, you see the buff clearly.
        </p>

        <h2>Abilities filtered by phase</h2>
        <p className="mt-3">
          A typical Age of Sigmar army has abilities that trigger in different
          phases. Play mode filters the list: tap Hero to see hero phase
          abilities, tap Charge to see charge phase abilities, and so on. You
          don&apos;t scroll past irrelevant text. You see only what applies right
          now.
        </p>

        <h2>No account. Lists stay on your device.</h2>
        <p className="mt-3">
          Order of Battle does not upload lists to a server. Everything stays in
          your browser (IndexedDB). Play mode reads the list from your device and
          updates damage locally. No login required. If you clear the browser,
          lists can vanish, so export anything you care about.
        </p>

        <h2>Start with a list</h2>
        <p className="mt-3">
          Play mode requires a saved list. Build one first:
        </p>
        <ol>
          <li>
            Open <Link href="/dashboard">My lists</Link>.
          </li>
          <li>Create a new list and pick a faction.</li>
          <li>Add regiments and a battle formation.</li>
          <li>Save the list.</li>
          <li>Open that list and hit Play.</li>
        </ol>
        <p>
          Walkthrough:{" "}
          <Link href="/guides/how-to-build-an-age-of-sigmar-army-list">
            how to build an Age of Sigmar army list
          </Link>
          . Overview:{" "}
          <Link href="/guides/free-age-of-sigmar-army-builder">
            free army builder
          </Link>
          .
        </p>

        <h2>Why Order of Battle for Play mode?</h2>
        <p className="mt-3">
          Most Age of Sigmar list builders stop at the list. Order of Battle
          continues into the game. Wound tracking, lasting buffs, and phase
          filtering are purpose-built for the table. Build the list. Play the
          battle.
        </p>
        <p>
          Compare with other builders:{" "}
          <Link href="/compare">army builder comparison</Link>.
        </p>
      </ContentDoc>
    </>
  );
}
