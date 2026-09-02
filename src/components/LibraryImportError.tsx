"use client";

import {
  CONFIRM_SHEET_ACTIONS_CLASS,
  CONFIRM_SHEET_PANEL_CLASS,
  IOS_LIQUID_CTA_CLASS,
} from "@/lib/builderUi";
import { ModalFrame } from "./ModalFrame";

type Props = {
  error: string;
  onClose: () => void;
};

export function LibraryImportError({ error, onClose }: Props) {
  return (
    <ModalFrame
      label="Import failed"
      onClose={onClose}
      panelClassName={CONFIRM_SHEET_PANEL_CLASS}
    >
      <p className="px-2 pb-2 text-center text-sm leading-relaxed text-sheet-muted">
        {error}
      </p>
      <div className={CONFIRM_SHEET_ACTIONS_CLASS}>
        <button type="button" onClick={onClose} className={IOS_LIQUID_CTA_CLASS}>
          OK
        </button>
      </div>
    </ModalFrame>
  );
}
