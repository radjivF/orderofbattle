import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { articleNode, breadcrumbNode, faqPageNode, pageGraph } from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

const title = "Age of Sigmar wound tracker: Play mode";
const description =
  "Play is the table half of Order of Battle: wounds on each unit, lasting spells and prayers, abilities for the phase you are in. Free. No account.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Age of Sigmar wound tracker",
    "track wounds AoS",
    "Age of Sigmar Play mode",
    "AoS wounds during a game",
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
          Play is the table half of Order of Battle. You build the list in the
          browser, then open it during the game and mark wounds as they happen.
          Lasting spells and prayers sit on the unit they affect. Abilities are
          grouped by phase, so you are looking at hero, movement, shooting,
          charge, combat, or end of turn, not the whole warscroll pile at once.
        </p>
        <p>
          Nothing to sign in for. Lists stay in the browser on this device.
          Clearing site data can wipe them, so export anything you would miss.
        </p>

        <h2>Wound tracking</h2>
        <p className="mt-3">
          Each unit shows health, leftover models, and battle damage. When a
          hero is on 3 wounds and a regiment is down to 6 models, you can see
          it without a scrap of paper. Age of Sigmar units take a lot of
          wounds; counting them in your head gets messy by turn three.
        </p>

        <h2>Lasting spells and prayers</h2>
        <p className="mt-3">
          Some spells and prayers hang around until the next hero phase or the
          end of the turn. Easy to forget whose buff that was. Play marks the
          unit, so when combat starts you still see it.
        </p>

        <h2>Abilities by phase</h2>
        <p className="mt-3">
          Armies have a lot of phase-specific rules. Tap the phase you are in
          and you get the abilities that apply now, not a scroll through
          everything on the warscroll.
        </p>

        <h2>Do you need an account?</h2>
        <p className="mt-3">
          No. Order of Battle does not upload lists. Play reads from this
          device and updates locally. If you clear the browser, lists vanish.
          Export anything you care about.
        </p>

        <h2>How to start</h2>
        <p className="mt-3">Play needs a saved list. Build one first:</p>
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

        <h2>Why this exists</h2>
        <p className="mt-3">
          Most Age of Sigmar builders stop once the points add up. This one
          keeps going into the game: wounds, lasting buffs, phase filtering.
        </p>
        <p>
          Compare:{" "}
          <Link href="/compare">other builders</Link>.
        </p>
      </ContentDoc>
    </>
  );
}
