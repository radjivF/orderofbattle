import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Order of Battle handles data. Free hobby app. Lists stay on your device.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy policy" updated="28 August 2026">
      <p>
        This Privacy Policy explains how Order of Battle (&quot;the app,&quot; &quot;we,&quot; &quot;us&quot;)
        handles information when you use the website. Order of Battle is a{" "}
        <strong className="font-semibold text-parchment">
          free, unofficial fan project
        </strong>{" "}
        for the Age of Sigmar hobby community. It is not a commercial product. We
        do not sell subscriptions, ads, or your data. There is no account to buy
        and nothing to pay.
      </p>

      <section>
        <h2>1. What this app is</h2>
        <p className="mt-3">
          Order of Battle helps you build army lists and track a game at the
          table. It is made to be useful and kind to the community. It is not
          affiliated with, endorsed by, or connected to Games Workshop or any
          Games Workshop company.
        </p>
      </section>

      <section>
        <h2>2. What we collect</h2>
        <p className="mt-3">
          Army lists and play state are stored in your browser (IndexedDB /
          local storage on your device). We do not upload list files to Order of
          Battle servers. There is no account.
        </p>
        <p className="mt-3">
          That is not the same as &quot;nothing about your list ever leaves the
          device.&quot;
        </p>
        <p className="mt-3">
          Microsoft Clarity records how the site is used: pages, clicks, and
          session recordings. That includes marketing pages and the app screens
          (/dashboard, /lists, Play). If a list is visible on screen, the
          recording can show it. Clarity is there so we can see where the UI
          sticks. It is not a backup of your lists and we do not pull list files
          out of IndexedDB into Clarity.
        </p>
        <p className="mt-3">We also use:</p>
        <ul className="mt-3">
          <li>
            Ahrefs Web Analytics for traffic stats (pages, referrers, device). No
            cookies. It does not read IndexedDB.
          </li>
          <li>Cloudflare for hosting, security, and browser insights.</li>
        </ul>
        <p className="mt-3">
          Host and CDN logs can include IP address, browser, and request
          metadata. That is separate from IndexedDB.
        </p>
        <p className="mt-3">
          Microsoft and Ahrefs process their data under their own privacy
          policies.
        </p>
      </section>

      <section>
        <h2>3. How we use information</h2>
        <p className="mt-3">We use technical logs only to operate, secure, and
          fix the website. We do not use your lists for advertising, profiling,
          or sale. We do not train AI models on your lists.</p>
      </section>

      <section>
        <h2>4. Third parties</h2>
        <p className="mt-3">
          The site may be hosted by a standard web host or CDN (Cloudflare).
          Those providers process request data under their own terms in order to
          deliver the pages. We use Microsoft Clarity and Ahrefs Web Analytics
          for site usage; those are governed by Microsoft&apos;s and Ahrefs&apos; privacy
          policies. Catalogue content is derived from the community BSData
          project on GitHub; visiting external links (for example GitHub) is
          governed by those sites&apos; policies.
        </p>
      </section>

      <section>
        <h2>5. Retention and deletion</h2>
        <p className="mt-3">
          Your lists remain until you clear site data, remove them in the app,
          or wipe the browser. Host logs are kept only as long as needed for
          operations, security, or legal requirements. To ask about host-side
          logs, email{" "}
          <a
            href="mailto:contact@zheat.xyz?subject=Order%20of%20Battle%20privacy"
            className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
          >
            contact@zheat.xyz
          </a>
          .
        </p>
      </section>

      <section>
        <h2>6. Children</h2>
        <p className="mt-3">
          The app is aimed at adults in the tabletop hobby. We do not knowingly
          collect personal information from children. If you believe a child has
          submitted personal data to a host log, contact us and we will help
          where we can.
        </p>
      </section>

      <section>
        <h2>7. Security</h2>
        <p className="mt-3">
          Lists live on your device. No method of transmission or storage is
          perfectly secure. Clear site data on shared devices if you do not want
          others to see your lists.
        </p>
      </section>

      <section>
        <h2>8. Changes</h2>
        <p className="mt-3">
          We may update this policy. The &quot;Last updated&quot; date will change when we
          do. Continued use after an update means you accept the revised policy.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p className="mt-3">
          Privacy questions:{" "}
          <a
            href="mailto:contact@zheat.xyz?subject=Order%20of%20Battle%20privacy"
            className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
          >
            contact@zheat.xyz
          </a>
        </p>
        <p className="mt-3">Also see the Terms of use for how the free app may
          be used and the Games Workshop / BSData disclaimers.</p>
      </section>
    </LegalDoc>
  );
}
