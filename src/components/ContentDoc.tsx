import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";

const linkClass =
  "text-sigmarite underline decoration-sigmarite/40 underline-offset-2";

type Crumb = { href: string; label: string };

type Props = {
  kicker: string;
  title: string;
  updated: string;
  children: ReactNode;
  crumbs?: Crumb[];
};

export function ContentDoc({
  kicker,
  title,
  updated,
  children,
  crumbs,
}: Props) {
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

      <article className="mx-auto w-full max-w-3xl px-6 pb-16">
        {crumbs && crumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
            <ol className="flex flex-wrap gap-x-2 gap-y-1">
              {crumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-2">
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  <Link href={crumb.href} className={linkClass}>
                    {crumb.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <p className="mt-4 text-sm font-semibold tracking-wide text-ink-muted uppercase">
          {kicker}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-parchment">{title}</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Last updated: <time dateTime="2026-08-27">{updated}</time>
        </p>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-parchment/85 [&_a]:text-sigmarite [&_a]:underline [&_a]:decoration-sigmarite/40 [&_a]:underline-offset-2 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-parchment [&_h3]:mt-6 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-parchment [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_table]:text-left [&_table]:text-sm [&_td]:border-t [&_td]:border-sigmarite/20 [&_td]:py-2 [&_td]:pr-3 [&_th]:py-2 [&_th]:pr-3 [&_th]:font-semibold [&_th]:text-parchment [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>

        <nav className="mt-12 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/guides" className={linkClass}>
            Guides
          </Link>
          <Link href="/compare" className={linkClass}>
            Compare
          </Link>
          <Link href="/play" className={linkClass}>
            Play
          </Link>
          <Link href="/faq" className={linkClass}>
            FAQ
          </Link>
          <Link href="/factions" className={linkClass}>
            Factions
          </Link>
          <Link href="/about" className={linkClass}>
            About
          </Link>
          <Link href="/" className={linkClass}>
            Home
          </Link>
        </nav>
      </article>
    </div>
  );
}
