import Link from "next/link";
import { HOME_CTA_CLASS } from "@/lib/builderUi";
import { SITE_CONTACT_EMAIL, SITE_GITHUB_URL, SITE_MAKER_URL } from "@/lib/site";

const linkClass =
  "text-parchment/85 underline decoration-parchment/40 underline-offset-2 transition-colors hover:text-sigmarite hover:decoration-sigmarite/50";

const mailHref = `mailto:${SITE_CONTACT_EMAIL}?subject=Commission%20list%20builder`;

export function SiteFooter() {
  return (
    <footer className="px-5 pb-12 text-center text-xs leading-relaxed font-medium text-parchment/70 sm:px-6">
      <div
        className="gilded-card mx-auto mb-8 max-w-3xl rounded-2xl p-5 text-left sm:p-8"
      >
        <h2 className="gold-text font-serif text-xl sm:text-2xl">
          This app is free. It stays free.
        </h2>
        <div className="gold-rule mt-4 w-20" aria-hidden="true" />
        <p className="mt-5 text-sm leading-relaxed text-parchment/80">
          I cannot make money from Order of Battle. Unofficial fan project. No
          ads, no accounts, no paid features in this app.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-parchment/80">
          Order of Battle does not host game data files. Age of Sigmar catalogue
          data is maintained by the BSData community and sourced from{" "}
          <a
            href="https://github.com/BSData"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
          >
            GitHub
          </a>
          .
        </p>
        <p className="mt-3 text-sm leading-relaxed text-parchment/80">
          If you want this list builder, or you want me to make one, contact me.
          Commission the work or buy it. I would rather the community keep a
          helper than see it closed down.
        </p>
        <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <a
            href={SITE_MAKER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={HOME_CTA_CLASS}
          >
            Commission list builder
          </a>
          <a
            href={mailHref}
            className="text-sm text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
          >
            {SITE_CONTACT_EMAIL}
          </a>
        </div>
      </div>

      <div className="gold-rule mx-auto mb-6 w-28" aria-hidden="true" />
      <p>
        Not affiliated with Games Workshop. Just a hobby helper for the
        community. Confirm points and rules with official sources before you
        play.
      </p>
      <p className="mt-2">
        Made to help the community. Be nice. JW (James Workshop) is a joke, not
        affiliation.
      </p>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/guides/free-age-of-sigmar-army-builder" className={linkClass}>
          Free army builder
        </Link>
        <Link href="/guides/how-to-build-an-age-of-sigmar-army-list" className={linkClass}>
          How to build a list
        </Link>
        <Link href="/factions" className={linkClass}>
          Factions
        </Link>
        <Link href="/faq" className={linkClass}>
          FAQ
        </Link>
        <Link href="/about" className={linkClass}>
          About
        </Link>
        <a
          href={SITE_GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          GitHub
        </a>
        <Link href="/privacy" className={linkClass}>
          Privacy
        </Link>
        <Link href="/terms" className={linkClass}>
          Terms
        </Link>
        <a href="/sitemap.xml" className={linkClass}>
          Sitemap
        </a>
      </p>
    </footer>
  );
}
