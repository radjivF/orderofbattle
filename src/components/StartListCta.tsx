import Link from "next/link";
import { HOME_CTA_CLASS } from "@/lib/builderUi";
import { newListPath } from "@/lib/newListLink";

type Props = {
  factionId?: string;
  factionName?: string;
};

export function StartListCta({ factionId, factionName }: Props) {
  const label = factionName
    ? `Start a ${factionName} list`
    : "Start a list";
  return (
    <Link
      href={newListPath(factionId)}
      className={`${HOME_CTA_CLASS} w-full no-underline sm:w-auto`}
    >
      {label}
    </Link>
  );
}
