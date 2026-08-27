import Link from "next/link";

const linkClass =
  "text-parchment/85 underline decoration-parchment/40 underline-offset-2 transition-colors hover:text-sigmarite hover:decoration-sigmarite/50";

export function SiteFooter() {
  return (
    <footer className="px-5 pb-12 text-center text-xs leading-relaxed font-medium text-parchment/70 [text-shadow:0_1px_6px_rgba(0,0,0,0.75)] sm:px-6">
      <div className="gold-rule mx-auto mb-6 w-28" aria-hidden="true" />
      <p>
        Free unofficial fan project. Not affiliated with Games Workshop. No ads,
        no accounts, no paid features in this app — just a hobby helper for the
        community.
      </p>
      <p className="mt-2">
        Order of Battle does not host game data files. Age of Sigmar catalogue
        data is maintained by the BSData community and sourced from{" "}
        <a
          href="https://github.com/BSData"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          GitHub
        </a>
        . Confirm points and rules with official sources before you play.
      </p>
      <p className="mt-2">
        Made to help the community. Be nice. JW (James Workshop) — a joke, not
        affiliation.
      </p>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/privacy" className={linkClass}>
          Privacy policy
        </Link>
        <Link href="/terms" className={linkClass}>
          Terms of use
        </Link>
      </p>
    </footer>
  );
}
