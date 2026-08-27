import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";

type Props = {
  title: string;
  updated: string;
  children: ReactNode;
};

export function LegalDoc({ title, updated, children }: Props) {
  return (
    <div className="min-h-full bg-ink text-parchment">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 sm:px-6 sm:py-6">
        <Link href="/" className="flex min-h-11 items-center gap-3">
          <BrandMark size={40} className="h-9 w-auto" priority />
          <span className="gold-text font-serif text-xl leading-none sm:text-2xl">
            Order of Battle
          </span>
        </Link>
        <Link
          href="/dashboard"
          className="min-h-11 rounded-xl border border-sigmarite/30 px-4 text-sm leading-[2.75rem] text-parchment/85"
        >
          My lists
        </Link>
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
