import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { articleNode, breadcrumbNode, faqPageNode, pageGraph } from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

const title = "Which Age of Sigmar army builder should you use?";
const description =
  "Order of Battle, New Recruit, Listbot, and the official Warhammer app compared. Order of Battle adds Play mode (wound tracking, lasting spells, phase abilities). New Recruit has cloud sync. Listbot is simplest. Official app needs a GW account.";

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
          Four free Age of Sigmar 4th edition army builders exist: Order of Battle, New Recruit, Listbot, and the official Warhammer app. Order of Battle is a browser builder with Play mode. Play mode tracks wounds on every unit, marks lasting spells and prayers, and filters abilities by phase (hero, movement, shooting, charge, combat, end of turn). No account. Lists stay on your device in IndexedDB. New Recruit is a browser builder with optional cloud sync. It covers many game systems, not just Age of Sigmar. Optional account. Listbot is a text-focused browser builder. No account. Lists in browser storage. The official Warhammer app is Games Workshop&apos;s mobile app. Needs a GW account. Uses official Games Workshop data. All four build regiments, add battle formations, and total points. Pick based on what you need: Play mode, cloud sync, simplicity, or official data.
        </p>

        <h2>What is Order of Battle?</h2>
        <ul>
          <li>
            <strong>Order of Battle</strong>: This one. Free browser builder with
            Play mode (wound tracking, lasting spells, phase abilities). No
            account. Lists stay on your device.
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
          All four work. Order of Battle adds Play mode. New Recruit and the
          official app have cloud sync. Listbot is the simplest. Pick what you
          need.
        </p>

        <h2>Which Age of Sigmar builder has wound tracking?</h2>
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
              <td>Device (IndexedDB)</td>
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
              <td>Play mode / table companion</td>
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
              <td>Phone interface</td>
              <td>Yes (Play mode)</td>
              <td>Yes</td>
              <td>Basic</td>
              <td>Yes</td>
            </tr>
          </tbody>
        </table>

        <h2>When should you use Order of Battle?</h2>
        <p className="mt-3">
          Use Order of Battle if you want Play mode. Build the list in the browser,
          then open Play to track wounds, mark lasting spells and prayers, and
          filter abilities by phase. No account. Lists stay on your device in
          IndexedDB. Export if you want a backup.
        </p>
        <p>
          Catalogue is community BSData, not Games Workshop. Confirm points with
          your opponent or TO before you play.
        </p>

        <h2>When should you use New Recruit?</h2>
        <p className="mt-3">
          Use New Recruit if you need cloud sync or if you play multiple game
          systems. Browser builder with optional cloud sync. Covers many systems,
          not just Age of Sigmar. Optional account. If you need lists across
          devices, New Recruit does that.
        </p>

        <h2>When should you use Listbot?</h2>
        <p className="mt-3">
          Use Listbot if you want the simplest interface. Text-focused builder in
          the browser. No account, no frills. If you want minimal interface and no
          Play features, Listbot works.
        </p>

        <h2>When should you use the official Warhammer app?</h2>
        <p className="mt-3">
          Use the official app if you have a GW account and want official Games
          Workshop data. Most accurate points and rules. Integrates with other GW
          services. Covers all Warhammer systems.
        </p>

        <h2>Is Wahapedia an Age of Sigmar army builder?</h2>
        <p className="mt-3">
          No. Wahapedia is a rules reference, not a builder. Good for looking up
          warscrolls and abilities. You cannot build or export lists. Use it
          alongside any of the builders.
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
