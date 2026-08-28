import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { articleNode, breadcrumbNode, pageGraph } from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

const title = "Compare Age of Sigmar army builders";
const description =
  "Order of Battle, New Recruit, Listbot, and the official Warhammer app. What each one does. Which one has Play mode.";

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
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
          ]),
        ])}
      />
      <ContentDoc
        kicker="Comparison"
        title="Compare Age of Sigmar army builders"
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/compare", label: "Compare" },
        ]}
      >
        <p>
          Order of Battle, New Recruit, Listbot, and the official Warhammer app.
          What each one does.
        </p>

        <h2>The apps</h2>
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

        <h2>What they do</h2>
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

        <h2>Order of Battle</h2>
        <p className="mt-3">
          This app. Free browser builder plus Play mode. Track wounds, mark
          lasting spells and prayers, filter abilities by phase. No account. Lists
          stay on your device. Export if you want a backup.
        </p>
        <p>
          Catalogue is community BSData, not Games Workshop. Confirm points with
          your opponent or TO before you play.
        </p>

        <h2>New Recruit</h2>
        <p className="mt-3">
          Browser builder with optional cloud sync. Covers many game systems, not
          just Age of Sigmar. If you play multiple games or need lists across
          devices, New Recruit does that.
        </p>

        <h2>Listbot</h2>
        <p className="mt-3">
          Text-focused builder in the browser. No account, no frills. If you want
          minimal interface and no Play features, Listbot works.
        </p>

        <h2>Official Warhammer app</h2>
        <p className="mt-3">
          Official Games Workshop data. If you have a GW account and want the most
          accurate points and rules, use the official app. Integrates with other
          GW services, covers all Warhammer systems.
        </p>

        <h2>Wahapedia</h2>
        <p className="mt-3">
          Rules reference, not a builder. Good for looking up warscrolls and
          abilities. You cannot build or export lists. Use it alongside any of the
          builders.
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
