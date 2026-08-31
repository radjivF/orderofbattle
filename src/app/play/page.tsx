import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { articleNode, breadcrumbNode, faqPageNode, pageGraph } from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

const title = "Age of Sigmar wound tracker: Play mode";
const description =
  "Play organizes an Age of Sigmar game from your list: this phase, these weapons, these abilities, the datasheet if you need it, plus wounds and lasting magic. Free. No account.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Age of Sigmar wound tracker",
    "Age of Sigmar Play mode",
    "AoS phase abilities",
    "Age of Sigmar datasheet during a game",
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
          articleNode({
            url,
            headline: title,
            description,
            dateModified: "2026-08-31",
          }),
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
        updated="31 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/play", label: "Play" },
        ]}
      >
        <p>
          I built Play because I wanted to run a game without opening the
          battletome. We sat down, played, and the book stayed closed. Wounds,
          the phase we were in, the weapons that fire now, the abilities that
          apply now, and the datasheet if someone asked a rules question. It
          was all on the list.
        </p>
        <p>
          A lot of Age of Sigmar tools stop at the roster. Some add a Play
          screen that is still just that roster, frozen. A few let you jump
          between phases. What they do not do is break the game down: ranged
          weapons in shooting, melee in combat, abilities for this phase,
          commands, and the full sheet one tap away.
        </p>
        <p>
          That organization is the point. Confirm points and rules with
          official publications before an event. Play is a helper, not a
          substitute for Games Workshop materials.
        </p>

        <h2>What Play actually is</h2>
        <p className="mt-3">
          You build the list in the browser, then open Play on that same list.
          You are not looking at a printout. You are looking at the turn.
        </p>
        <ul>
          <li>
            Phases: Army, Hero, Movement, Shooting, Charge, Combat, End of
            turn.
          </li>
          <li>
            In shooting, the ranged weapons. In combat, the melee weapons.
          </li>
          <li>
            Abilities that belong to this phase, including commands and the
            core rules that apply now.
          </li>
          <li>
            Tap a unit for the datasheet: stats, weapons, abilities.
          </li>
          <li>
            Wounds and leftover models as the fight goes on.
          </li>
          <li>
            Lasting spells and prayers marked on the unit they affect.
          </li>
          <li>Battle tactic cards, if you picked them on the list.</li>
        </ul>

        <h2>Phases, not a wall of warscrolls</h2>
        <p className="mt-3">
          Age of Sigmar has a lot of text that only matters in one phase. Tap
          Hero and you get hero-phase abilities, spells, prayers. Tap Shooting
          and you get shooting abilities plus ranged weapons. Combat is melee
          weapons and combat abilities. End of turn is the stuff that is easy
          to forget when you are packing dice.
        </p>
        <p>
          Army sits first: battle traits, formation, passives, deploy. You do
          not have to hunt those on every unit card.
        </p>

        <h2>Weapons for this phase</h2>
        <p className="mt-3">
          Shooting and combat each list the weapons that fire in that phase,
          unit by unit. Attacks, range, to-hit, to-wound: the line you need
          when the model is in range, without flipping the whole scroll.
        </p>

        <h2>Abilities, commands, core rules</h2>
        <p className="mt-3">
          Abilities are split into army-wide and roster. Command abilities
          have their own tab on the phases that use them. Core rules that
          apply this phase are there too, so you are not mixing universal
          timing with a single warscroll.
        </p>

        <h2>The datasheet when you need the whole thing</h2>
        <p className="mt-3">
          Phase boards answer &quot;what can I do right now?&quot; Sometimes
          you still need the full sheet: keywords, every weapon, every
          ability. Tap the unit. The datasheet opens over the game. Close it
          and you are back on the phase.
        </p>

        <h2>Wounds and leftover models</h2>
        <p className="mt-3">
          Each unit shows health, leftover models, and battle damage. When a
          hero is on 3 wounds and a regiment is down to 6 models, you can see
          it without a scrap of paper. Age of Sigmar units take a lot of
          wounds. Counting them in your head gets messy by turn three.
        </p>

        <h2>Lasting spells and prayers</h2>
        <p className="mt-3">
          Some spells and prayers hang around until the next hero phase or the
          end of the turn. Easy to forget whose buff that was. Play marks the
          unit, so when combat starts you still see it.
        </p>

        <h2>What players asked for</h2>
        <p className="mt-3">
          The first people who used the builder asked for gaps that showed up
          at the table, not on a feature list. Battle tactic cards, with a
          tracker in Play. Scourge of Aqshy extras (special enhancements, and
          picking the season warscroll on the unit instead of one global
          switch). A duplicate action on units so you are not rebuilding a
          regiment by hand. Those are in the app.
        </p>
        <p>
          Play also keeps getting the boring fixes: remaining models, which
          abilities fire this phase, lasting magic that used to get forgotten.
          If something is wrong,{" "}
          <a href="mailto:contact@zheat.xyz">contact@zheat.xyz</a>.
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
          . Compare:{" "}
          <Link href="/compare">other builders</Link>.
        </p>
      </ContentDoc>
    </>
  );
}
