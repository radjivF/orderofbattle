import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { articleNode, breadcrumbNode, faqPageNode, pageGraph } from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

const title = "Which Age of Sigmar army builder should you use?";
const description =
  "Order of Battle, New Recruit, Listbot, and the official Warhammer app. This one organizes Play: phase, weapons, abilities, datasheet. New Recruit has cloud sync. Listbot is smaller. The official app needs a GW account.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Age of Sigmar army builder",
    "Order of Battle vs New Recruit",
    "AoS list builder",
    "free Age of Sigmar app",
  ],
  alternates: { canonical: "/compare" },
  openGraph: { title, description, type: "article" },
};

export default function ComparePage() {
  const url = sitePath("/compare");
  return (
    <>
      <JsonLd
        data={pageGraph([
          articleNode({ url, headline: title, description }),
          faqPageNode(url),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
          ]),
        ])}
      />
      <ContentDoc
        kicker="Comparison"
        title="Which Age of Sigmar army builder should you use?"
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/compare", label: "Compare" },
        ]}
      >
        <p>
          A few free 4th edition list tools exist: this one, New Recruit,
          Listbot, and Games Workshop&apos;s official app. They all do
          regiments, formations, and points. The difference is what happens
          after the list is done.
        </p>
        <p>
          Order of Battle stays with you during the game. Play marks wounds,
          lasting spells and prayers, and the abilities for the current phase.
          No account. Lists stay on this device. New Recruit is a browser
          builder with optional cloud sync, and it covers many game systems.
          Listbot is a small text-first builder. The official app is Games
          Workshop&apos;s, needs a GW account, and uses their data.
        </p>

        <h2>The four builders</h2>
        <ul>
          <li>
            <strong>Order of Battle</strong>: This one. Free browser builder with
            Play mode (wounds, lasting spells, phase abilities). You don&apos;t
            need an account; lists stay on your device.
          </li>
          <li>
            <strong>New Recruit</strong> (newrecruit.eu): Browser builder, optional
            cloud sync. Covers many game systems. Optional account.
          </li>
          <li>
            <strong>Listbot</strong> (aoslistbot.herokuapp.com): Text-focused
            builder. No account. Lists in browser storage.
          </li>
          <li>
            <strong>Official Warhammer app</strong>: Games Workshop&apos;s app.
            Needs a GW account. Official data.
          </li>
        </ul>
        <p>
          All four work. Order of Battle is the one with Play. New Recruit and
          the official app sync to the cloud. Listbot is the smallest. Pick
          what you actually need.
        </p>

        <h2>Who tracks wounds?</h2>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Order of Battle</th>
              <th>New Recruit</th>
              <th>Listbot</th>
              <th>Official app</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Price</td>
              <td>Free</td>
              <td>Free</td>
              <td>Free</td>
              <td>Free (GW account)</td>
            </tr>
            <tr>
              <td>Account required</td>
              <td>No</td>
              <td>Optional</td>
              <td>No</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>List storage</td>
              <td>On this device</td>
              <td>Cloud or local</td>
              <td>Device</td>
              <td>Cloud (GW account)</td>
            </tr>
            <tr>
              <td>Data source</td>
              <td>BSData community</td>
              <td>Community</td>
              <td>Community</td>
              <td>Official GW data</td>
            </tr>
            <tr>
              <td>Regiments &amp; formations</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>Play (wounds, spells, phases)</td>
              <td>Yes (wounds, spells, phases)</td>
              <td>No</td>
              <td>No</td>
              <td>Limited</td>
            </tr>
            <tr>
              <td>Wound tracking</td>
              <td>Yes, per unit</td>
              <td>No</td>
              <td>No</td>
              <td>Basic</td>
            </tr>
            <tr>
              <td>Lasting spells and prayers</td>
              <td>Yes, marked on units</td>
              <td>No</td>
              <td>No</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Phase abilities filter</td>
              <td>Yes</td>
              <td>No</td>
              <td>No</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Weapons for this phase</td>
              <td>Yes</td>
              <td>No</td>
              <td>No</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Datasheet during the game</td>
              <td>Yes</td>
              <td>No</td>
              <td>No</td>
              <td>Warscroll lookup</td>
            </tr>
            <tr>
              <td>Battle tactics in Play</td>
              <td>Yes</td>
              <td>No</td>
              <td>No</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Works offline</td>
              <td>Yes (after first load)</td>
              <td>Limited</td>
              <td>Yes</td>
              <td>App install needed</td>
            </tr>
            <tr>
              <td>Game systems</td>
              <td>AoS only</td>
              <td>Many systems</td>
              <td>AoS only</td>
              <td>All Warhammer</td>
            </tr>
            <tr>
              <td>Small screen</td>
              <td>Yes (Play mode)</td>
              <td>Yes</td>
              <td>Basic</td>
              <td>Yes</td>
            </tr>
          </tbody>
        </table>

        <h2>When Order of Battle fits</h2>
        <p className="mt-3">
          Use this if you want the list and the game in one place. Other tools
          often stop at a roster, or show that roster as a Play screen you
          cannot change. Play here is organized around the turn: this phase,
          these weapons, these abilities, the datasheet if you need the whole
          sheet. Nothing to sign up for. Lists stay on the device; export if
          you want a backup.
        </p>
        <p>
          Catalogue is community BSData, not Games Workshop. Confirm points
          with your opponent or TO before you play.
        </p>

        <h2>When New Recruit fits</h2>
        <p className="mt-3">
          New Recruit if you play several game systems, or you want the same
          lists on more than one device. Browser builder, optional cloud,
          optional account.
        </p>

        <h2>When Listbot fits</h2>
        <p className="mt-3">
          Listbot if you want a small text-first builder and nothing else. No
          account, no Play features.
        </p>

        <h2>When the official app fits</h2>
        <p className="mt-3">
          The official app if you already have a GW account and want their
          data. Closest to published points and rules, and it covers the rest
          of Warhammer too.
        </p>

        <h2>Is Wahapedia a builder?</h2>
        <p className="mt-3">
          No. Wahapedia is a rules reference. Good for looking up warscrolls
          and abilities. You cannot build or export lists there. Use it next
          to any of the builders.
        </p>

        <h2>Start here</h2>
        <ol>
          <li>
            Open <Link href="/dashboard">My lists</Link>.
          </li>
          <li>
            Pick a faction from <Link href="/factions">factions</Link>.
          </li>
          <li>Build regiments, add a general, set a battle formation.</li>
          <li>Hit Play at the table.</li>
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
      </ContentDoc>
    </>
  );
}
