import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { articleNode, breadcrumbNode, pageGraph } from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

const title = "Play mode: track wounds and abilities";
const description =
  "Play mode in Order of Battle. Track wounds, mark lasting spells and prayers, filter abilities by phase. Free on your phone.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Age of Sigmar wound tracker",
    "track wounds AoS",
    "Age of Sigmar Play mode",
    "AoS table companion",
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
        title="Play mode: track wounds and abilities"
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/play", label: "Play" },
        ]}
      >
        <p>
          Build the list in Order of Battle, then open Play. Track wounds, mark
          lasting spells and prayers, filter abilities by phase. On your phone.
        </p>

        <h2>What it does</h2>
        <p className="mt-3">
          Your list becomes a live scoreboard. No flipping warscrolls.
        </p>
        <ul>
          <li>
            <strong>Wound tracking</strong>: Adjust health on every unit mid-game.
            Models, damage, battle damage.
          </li>
          <li>
            <strong>Lasting spells and prayers</strong>: Mark which unit has the
            buff. See it in combat.
          </li>
          <li>
            <strong>Abilities by phase</strong>: Hero, movement, shooting, charge,
            combat, end of turn. Only what that phase needs.
          </li>
        </ul>

        <h2>How to use it</h2>
        <ol>
          <li>
            Build a list in <Link href="/dashboard">My lists</Link>.
          </li>
          <li>
            Open it and tap <strong>Play</strong>.
          </li>
          <li>Track wounds as damage happens.</li>
          <li>Mark lasting spells or prayers on units.</li>
          <li>Tap the phase button to filter abilities.</li>
          <li>Reset when the game ends.</li>
        </ol>
        <p>Play mode is for phones. Update at the table in real time.</p>

        <h2>Wound tracking</h2>
        <p className="mt-3">
          Age of Sigmar units take many wounds. Tracking on paper or in your head
          gets messy. Play mode shows health for every unit in one place.
        </p>
        <p>
          Mid-game, you know which hero took 3 wounds and which regiment is down
          to 6 models. No guessing.
        </p>

        <h2>Lasting spells and prayers</h2>
        <p className="mt-3">
          Some buffs last until your next hero phase or end of turn. Easy to
          forget which unit has the buff. Play mode marks it. When combat starts,
          you see the buff.
        </p>

        <h2>Abilities by phase</h2>
        <p className="mt-3">
          Age of Sigmar armies have abilities for different phases. Play mode
          filters them. Tap Hero to see hero phase abilities. Tap Charge to see
          charge abilities. Only what applies now.
        </p>

        <h2>No account</h2>
        <p className="mt-3">
          Order of Battle does not upload lists. Everything stays in your browser
          (IndexedDB). Play mode reads from your device and updates locally. No
          login. If you clear the browser, lists vanish. Export anything you care
          about.
        </p>

        <h2>Start with a list</h2>
        <p className="mt-3">Play mode needs a saved list. Build one first:</p>
        <ol>
          <li>
            Open <Link href="/dashboard">My lists</Link>.
          </li>
          <li>Create a list and pick a faction.</li>
          <li>Add regiments and a battle formation.</li>
          <li>Save it.</li>
          <li>Open it and hit Play.</li>
        </ol>
        <p>
          Walkthrough:{" "}
          <Link href="/guides/how-to-build-an-age-of-sigmar-army-list">
            how to build a list
          </Link>
          . Overview:{" "}
          <Link href="/guides/free-age-of-sigmar-army-builder">
            free army builder
          </Link>
          .
        </p>

        <h2>Why Order of Battle</h2>
        <p className="mt-3">
          Most Age of Sigmar builders stop at the list. Order of Battle continues
          into the game. Wound tracking, lasting buffs, phase filtering. Build the
          list. Play the battle.
        </p>
        <p>
          Compare:{" "}
          <Link href="/compare">other builders</Link>.
        </p>
      </ContentDoc>
    </>
  );
}
