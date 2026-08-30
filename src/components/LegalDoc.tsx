import Link from "next/link";
import type { ReactNode } from "react";
import { SiteBrandLockup } from "@/components/BrandMark";
import { NewListCtaLink } from "@/components/StartListCta";
import { SITE_HEADER_BAR_CLASS, SITE_HEADER_ROW_CLASS } from "@/lib/builderUi";

type Props = {
  title: string;
  updated: string;
  children: ReactNode;
};

export function LegalDoc({ title, updated, children }: Props) {
  return (
    <div className="min-h-full bg-ink text-parchment">
      <header className={`${SITE_HEADER_BAR_CLASS} pt-[env(safe-area-inset-top)]`}>
        <div className={SITE_HEADER_ROW_CLASS}>
          <SiteBrandLockup />
          <NewListCtaLink layout="header" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 pb-16">
        <p className="text-sm font-semibold tracking-wide uppercase text-ink-muted">
          Legal
        </p>
        <h1 className="mt-2 font-serif text-4xl text-parchment">{title}</h1>
        <p className="mt-3 text-sm text-ink-muted">Last updated: {updated}</p>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-parchment/85 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-parchment [&_li]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>

        <nav className="mt-12 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link
            href="/privacy"
            className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
          >
            Privacy policy
          </Link>
          <Link
            href="/terms"
            className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
          >
            Terms of use
          </Link>
          <Link
            href="/"
            className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
          >
            Back to home
          </Link>
        </nav>
      </main>
    </div>
  );
}
