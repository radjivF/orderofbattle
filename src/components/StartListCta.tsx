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
  /** header: compact for nav bars; block: article hero; inline: mid-article repeat. */
  layout?: "header" | "block" | "inline";
};

export function NewListCtaLink({ layout = "block" }: NewListCtaLinkProps) {
  const layoutClass =
    layout === "header"
      ? "shrink-0 min-h-11 px-5 text-sm"
      : layout === "inline"
        ? "min-h-11 w-full px-5 text-sm sm:w-fit"
        : "min-h-12 w-full justify-center px-6 text-base sm:w-fit";

  return (
    <Link
      href={newListPath()}
      className={`${HOME_CTA_CLASS} ${FOCUS_RING_CLASS} no-underline ${layoutClass}`}
    >
      New list
      <CtaChevron />
    </Link>
  );
}

type StartListCtaProps = {
  layout?: "block" | "inline";
};

/** Article CTA — opens the new-list sheet with faction picker. */
export function StartListCta({ layout = "block" }: StartListCtaProps) {
  return (
    <NewListCtaLink layout={layout === "inline" ? "inline" : "block"} />
  );
}
