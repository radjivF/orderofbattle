import Link from "next/link";
import { HOME_CTA_CLASS } from "@/lib/builderUi";
import { newListPath } from "@/lib/newListLink";

const FOCUS_RING_CLASS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sigmarite";

export function CtaChevron() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path
        d="M7.5 4.5 13 10l-5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type NewListCtaLinkProps = {
  factionId?: string;
  /** header: compact for nav bars; block: article hero; inline: mid-article repeat. */
  layout?: "header" | "block" | "inline";
};

export function NewListCtaLink({
  factionId,
  layout = "block",
}: NewListCtaLinkProps) {
  const layoutClass =
    layout === "header"
      ? "shrink-0 min-h-11 px-5 text-sm"
      : layout === "inline"
        ? "min-h-11 w-full px-5 text-sm sm:w-fit"
        : "min-h-12 w-full justify-center px-6 text-base sm:w-fit";

  return (
    <Link
      href={newListPath(factionId)}
      className={`${HOME_CTA_CLASS} ${FOCUS_RING_CLASS} no-underline ${layoutClass}`}
    >
      New list
      <CtaChevron />
    </Link>
  );
}

type StartListCtaProps = {
  factionId?: string;
  factionName?: string;
  layout?: "block" | "inline";
};

export function StartListCta({
  factionId,
  factionName,
  layout = "block",
}: StartListCtaProps) {
  const helper = factionName
    ? `${factionName} pre-selected in the new-list sheet.`
    : "Opens the new-list sheet on My list.";

  const link = (
    <NewListCtaLink
      factionId={factionId}
      layout={layout === "inline" ? "inline" : "block"}
    />
  );

  if (layout === "inline") {
    return link;
  }

  return (
    <div className="my-2 flex flex-col items-stretch gap-2 sm:my-3 sm:items-start">
      {link}
      <p className="text-sm leading-snug text-ink-muted">{helper}</p>
    </div>
  );
}
