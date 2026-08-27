import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "Terms for Order of Battle, a free unofficial Age of Sigmar hobby helper.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of use" updated="27 August 2026">
      <p>
        These Terms govern your use of Order of Battle. By using the app, you
        agree to them. Order of Battle is a{" "}
        <strong className="font-semibold text-parchment">
          free, benevolent, unofficial fan project
        </strong>
        . It is made to help the hobby community. It is not sold, not monetized
        with ads or subscriptions in this app, and not a commercial Games
        Workshop product.
      </p>

      <section>
        <h2>1. What Order of Battle is</h2>
        <p className="mt-3">
          Order of Battle is a browser tool to build Age of Sigmar army lists and
          track wounds, magic, and phase abilities at the table. Catalogue data
          is derived from the community BSData project. Points, rules text, and
          validation are helpers only. They may be incomplete, outdated, or
          wrong.
        </p>
        <p className="mt-3">
          Always confirm lists, points, and rules with official Games Workshop
          publications and your opponent or tournament organizer before you play.
        </p>
      </section>

      <section>
        <h2>2. Free community project — no affiliation</h2>
        <p className="mt-3">
          Warhammer, Age of Sigmar, and related names, marks, and imagery are
          property of Games Workshop or their respective owners. Order of Battle
          is{" "}
          <strong className="font-semibold text-parchment">
            not affiliated with, endorsed by, or sponsored by Games Workshop
          </strong>
          . This is fan work offered freely for hobby use. The JW / “James
          Workshop” line in the footer is a joke, not a claim of affiliation.
        </p>
        <p className="mt-3">
          Artwork shown in the app (including faction and landing images) is used
          for atmosphere in this unofficial helper. Rights in those works remain
          with their owners. If you are a rights holder and want something
          removed, email us and we will act in good faith.
        </p>
      </section>

      <section>
        <h2>3. No account, no payment</h2>
        <p className="mt-3">
          You do not need an account. Lists stay on your device. There is nothing
          to purchase in this app. If that ever changes, we will update these
          Terms clearly first.
        </p>
      </section>

      <section>
        <h2>4. Your responsibility</h2>
        <p className="mt-3">You agree that:</p>
        <ul className="mt-3">
          <li>
            You use the app at your own risk for casual hobby and personal use.
          </li>
          <li>
            You will not treat app output as official rules, tournament-legal
            proof, or a substitute for Games Workshop materials.
          </li>
          <li>
            You will not use the app to harass others, break the law, attack the
            service, scrape it abusively, or misrepresent it as an official Games
            Workshop product.
          </li>
          <li>
            You are responsible for backing up or exporting anything you care
            about; clearing browser data can delete lists.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Intellectual property</h2>
        <p className="mt-3">
          The Order of Battle name treatment, crest, and original UI code for
          this project are provided for running this free app. Games Workshop
          and other rights holders keep their own IP. BSData catalogue material
          remains subject to that community’s licenses and practices. These Terms
          do not transfer any Games Workshop IP to you or to us.
        </p>
      </section>

      <section>
        <h2>6. Disclaimers</h2>
        <p className="mt-3">
          THE APP IS PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF
          ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, ACCURACY OF POINTS OR RULES, AND NON-INFRINGEMENT,
          TO THE FULLEST EXTENT PERMITTED BY LAW.
        </p>
        <p className="mt-3">
          We do not warrant that the app will be uninterrupted, error-free, or
          that lists will match the latest official publications.
        </p>
      </section>

      <section>
        <h2>7. Limitation of liability</h2>
        <p className="mt-3">
          To the fullest extent permitted by law, the operator of Order of
          Battle will not be liable for indirect, incidental, special,
          consequential, or punitive damages, or for lost games, lists, data,
          goodwill, or tournament outcomes, arising from your use of the app or
          reliance on any points, rules text, or validation it shows.
        </p>
        <p className="mt-3">
          Because the app is free and you pay no fees, our aggregate liability
          for claims relating to the app will not exceed one hundred U.S. dollars
          (USD $100), or the minimum amount required by applicable law if that
          cap is not allowed.
        </p>
      </section>

      <section>
        <h2>8. Indemnification</h2>
        <p className="mt-3">
          You agree to indemnify and hold harmless the operator of Order of
          Battle from claims, damages, losses, and expenses (including reasonable
          attorneys’ fees) arising from your misuse of the app, your violation of
          these Terms, or your use of app output in an event or dispute—
          including claims that a list was “wrong” because the helper disagreed
          with official materials.
        </p>
      </section>

      <section>
        <h2>9. Availability</h2>
        <p className="mt-3">
          We may change, suspend, or stop offering the app at any time. You may
          stop using it at any time. Sections that by nature should survive
          (disclaimers, liability limits, IP notices) survive.
        </p>
      </section>

      <section>
        <h2>10. Changes</h2>
        <p className="mt-3">
          We may update these Terms. The “Last updated” date will change when we
          do. Continued use after changes means you accept the updated Terms. If
          you do not agree, stop using the app.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p className="mt-3">
          Questions about these Terms:{" "}
          <a
            href="mailto:contact@zheat.xyz?subject=Order%20of%20Battle%20terms"
            className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
          >
            contact@zheat.xyz
          </a>
        </p>
        <p className="mt-3">
          Privacy details are in the Privacy policy. Made for the hobby. Be
          nice.
        </p>
      </section>
    </LegalDoc>
  );
}
