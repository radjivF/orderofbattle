import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { articleNode, breadcrumbNode, pageGraph } from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

const title = "Age of Sigmar army builder comparison";
const description =
  "Compare Order of Battle with New Recruit, Listbot, and the official Warhammer app. Which free Age of Sigmar list builder fits your workflow?";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Age of Sigmar army builder comparison",
    "Order of Battle vs New Recruit",
    "best AoS list builder",
    "free Age of Sigmar app comparison",
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
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
          ]),
        ])}
      />
      <ContentDoc
        kicker="Comparison"
        title="Age of Sigmar army builder comparison"
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/compare", label: "Compare" },
        ]}
      >
        <p>
          A realistic comparison of Order of Battle with other free Age of Sigmar
          army builders. Which one fits your workflow?
        </p>

        <h2>The builders</h2>
        <ul>
          <li>
            <strong>Order of Battle</strong>: This app. Free unofficial browser
            builder with Play mode for wound tracking and phase abilities at the
            table. No account. Lists stay on your device.
          </li>
          <li>
            <strong>New Recruit</strong> (newrecruit.eu): Community favorite.
            Browser-based, clean interface, supports cloud sync with optional
            account. Wide game system coverage.
          </li>
          <li>
            <strong>Listbot</strong> (aoslistbot.herokuapp.com): Simple
            text-focused builder. No account. Lists in browser local storage.
          </li>
          <li>
            <strong>Official Warhammer app</strong>: Games Workshop&apos;s mobile
            app. Requires GW account. Official data, integrated with other GW
            services.
          </li>
        </ul>
        <p>
          All four are legitimate options. Order of Battle is not &quot;better&quot;
          than the rest. The wedge is Play mode: wound tracking, lasting spells,
          and abilities by phase at the table.
        </p>

        <h2>Feature comparison</h2>
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
              <td>Device only (IndexedDB)</td>
              <td>Cloud or local</td>
              <td>Device only</td>
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
              <td>Play / table companion</td>
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
              <td>Lasting spells/prayers</td>
              <td>Yes, marked on units</td>
              <td>No</td>
              <td>No</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Phase abilities</td>
              <td>Yes, filtered by phase</td>
              <td>No</td>
              <td>No</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Offline use</td>
              <td>Yes (after first load)</td>
              <td>Limited</td>
              <td>Yes</td>
              <td>Requires app install</td>
            </tr>
            <tr>
              <td>Multiple game systems</td>
              <td>No (AoS only)</td>
              <td>Yes (many systems)</td>
              <td>No (AoS only)</td>
              <td>Yes (all GW)</td>
            </tr>
            <tr>
              <td>Mobile optimized</td>
              <td>Yes (especially Play mode)</td>
              <td>Yes</td>
              <td>Basic</td>
              <td>Yes</td>
            </tr>
          </tbody>
        </table>

        <h2>Why Order of Battle?</h2>
        <p className="mt-3">
          Choose Order of Battle if you want a free Age of Sigmar army builder
          with a dedicated table companion. Play mode runs the game from your
          phone: track wounds, mark lasting buffs, and see only the abilities that
          matter for the current phase.
        </p>
        <p>
          No account. Lists stay on your device. Export if you need a backup. The
          catalogue is community BSData, not an official Games Workshop feed, so
          confirm points with your opponent or TO before you play.
        </p>

        <h2>Why New Recruit?</h2>
        <p className="mt-3">
          New Recruit is the established community favorite. Mature interface,
          optional cloud sync, and support for many game systems beyond Age of
          Sigmar. If you play multiple games or need cloud lists across devices,
          New Recruit is a solid choice.
        </p>

        <h2>Why Listbot?</h2>
        <p className="mt-3">
          Listbot is simple and text-focused. No frills, no account, just a quick
          list builder in the browser. If you prefer a minimal interface and
          don&apos;t need Play features, Listbot works.
        </p>

        <h2>Why the official app?</h2>
        <p className="mt-3">
          The official Warhammer app uses official Games Workshop data. If you
          want the most accurate points and rules, and you already have a GW
          account, the official app is the correct choice. It integrates with
          other GW services and covers all Warhammer systems.
        </p>

        <h2>Wahapedia is not a builder</h2>
        <p className="mt-3">
          Wahapedia is a rules reference, not an army list builder. It is
          excellent for looking up warscrolls and abilities, but you cannot build
          or export lists. Use Wahapedia alongside any of the builders above.
        </p>

        <h2>Start with Order of Battle</h2>
        <ol>
          <li>
            Open <Link href="/dashboard">My lists</Link> and create a list.
          </li>
          <li>
            Pick a faction from the{" "}
            <Link href="/factions">factions list</Link>.
          </li>
          <li>Build regiments, add a general, and set a battle formation.</li>
          <li>Hit Play when you&apos;re at the table.</li>
        </ol>
        <p>
          Walkthrough:{" "}
          <Link href="/guides/how-to-build-an-age-of-sigmar-army-list">
            how to build an Age of Sigmar army list
          </Link>
          . More details:{" "}
          <Link href="/guides/free-age-of-sigmar-army-builder">
            free army builder
          </Link>
          .
        </p>
      </ContentDoc>
    </>
  );
}
