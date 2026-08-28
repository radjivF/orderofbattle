import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { articleNode, breadcrumbNode, faqPageNode, pageGraph } from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

const title = "Age of Sigmar wound tracker: Play mode";
const description =
  "Play mode tracks wounds on every unit, marks lasting spells and prayers, and filters abilities by phase in Age of Sigmar. Free browser tool. No account. On your phone at the table.";

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
          faqPageNode(url),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Play", path: "/play" },
          ]),
        ])}
      />
      <ContentDoc
        kicker="Feature"
        title="Age of Sigmar wound tracker: Play mode"
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/play", label: "Play" },
        ]}
      >
        <p>
          Play mode is an Age of Sigmar wound tracker and table companion in Order of Battle. Build a list in the browser, then open Play at the table. Play mode tracks wounds on every unit (health, models, battle damage). It marks lasting spells and prayers on affected units. It filters abilities by phase: hero, movement, shooting, charge, combat, end of turn. You see only what applies in the current phase. No account. Lists stay on your device in IndexedDB. Play mode reads from your device and updates locally. On your phone in real time. No flipping warscrolls. If you clear the browser, lists vanish. Export if you care about a list.
        </p>

        <h2>How does Age of Sigmar wound tracking work in Play mode?</h2>
        <p className="mt-3">
          Adjust health on every unit mid-game. Models, damage, battle damage appear
          on the screen. Mid-game, you know which hero took 3 wounds and which
          regiment is down to 6 models. No guessing. Age of Sigmar units take many
          wounds. Tracking on paper or in your head gets messy. Play mode shows
          health for every unit in one place.
        </p>

        <h2>What are lasting spells and prayers in Age of Sigmar?</h2>
        <p className="mt-3">
          Some spells and prayers last until your next hero phase or end of turn.
          Easy to forget which unit has the buff. Play mode marks the unit. When
          combat starts, you see the buff on that unit.
        </p>

        <h2>How do you filter abilities by phase in Age of Sigmar?</h2>
        <p className="mt-3">
          Age of Sigmar armies have abilities for different phases. Play mode
          filters them. Tap Hero to see hero phase abilities. Tap Charge to see
          charge abilities. Tap Combat to see combat abilities. Only what applies in
          the current phase. No scrolling through every ability.
        </p>

        <h2>Does Age of Sigmar Play mode need an account?</h2>
        <p className="mt-3">
          No. Order of Battle does not upload lists. Everything stays in your
          browser (IndexedDB). Play mode reads from your device and updates locally.
          No login. If you clear the browser, lists vanish. Export anything you care
          about.
        </p>

        <h2>How do you start using Age of Sigmar Play mode?</h2>
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
