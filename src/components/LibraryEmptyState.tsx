import { BrandMark } from "./BrandMark";
import {
  EMPTY_LIBRARY_CTA_CLASS,
  EMPTY_LIBRARY_PANEL_CLASS,
  EMPTY_LIBRARY_SECONDARY_CLASS,
} from "@/lib/builderUi";

type Props = {
  onCreate: () => void;
  onImport: () => void;
};

export function LibraryMenuPlaceholder({ body }: { body: string }) {
  return (
    <div className={EMPTY_LIBRARY_PANEL_CLASS}>
      <BrandMark size={40} className="mx-auto mb-4 h-10 w-auto opacity-40" />
      <p className="text-sm leading-relaxed text-parchment/80">{body}</p>
    </div>
  );
}

export function LibraryEmptyState({ onCreate, onImport }: Props) {
  return (
    <div className={EMPTY_LIBRARY_PANEL_CLASS}>
      <BrandMark size={40} className="mx-auto mb-4 h-10 w-auto opacity-40" />
      <p className="font-serif text-3xl leading-snug text-parchment">
        No armies yet
      </p>
      <button type="button" onClick={onCreate} className={EMPTY_LIBRARY_CTA_CLASS}>
        Make your first list
      </button>
      <button
        type="button"
        onClick={onImport}
        className={EMPTY_LIBRARY_SECONDARY_CLASS}
      >
        Import a list
      </button>
    </div>
  );
}
