"use client";

import type { ArmyList } from "@/engine/types";
import {
  CONFIRM_CANCEL_BUTTON_CLASS,
  CONFIRM_SHEET_ACTIONS_CLASS,
  CONFIRM_SHEET_PANEL_CLASS,
  IOS_LIQUID_CTA_CLASS,
} from "@/lib/builderUi";
import { ModalFrame } from "./ModalFrame";

export type LibraryImportConfirmState = {
  novel: ArmyList[];
  skipped: number;
};

export function LibraryImportConfirm({
  importConfirm,
  onClose,
  onConfirm,
}: {
  importConfirm: LibraryImportConfirmState;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalFrame
      label={
        importConfirm.novel.length === 0
          ? "Already in My lists"
          : "Add lists?"
      }
      onClose={onClose}
      panelClassName={CONFIRM_SHEET_PANEL_CLASS}
    >
      <p className="px-2 pb-2 text-center text-sm leading-relaxed text-sheet-muted">
        {importConfirm.novel.length === 0 ? (
          "Those lists are already in My lists. Nothing will be added."
        ) : (
          <>
            {importConfirm.novel.length === 1
              ? `Add ${importConfirm.novel[0]?.name ?? "this list"} to My lists?`
              : `Add ${importConfirm.novel.length} lists to My lists?`}
            {importConfirm.skipped === 1
              ? " 1 list is already here and will be skipped."
              : importConfirm.skipped > 1
                ? ` ${importConfirm.skipped} lists are already here and will be skipped.`
                : null}
          </>
        )}
      </p>
      <div className={CONFIRM_SHEET_ACTIONS_CLASS}>
        {importConfirm.novel.length === 0 ? (
          <button
            type="button"
            onClick={onClose}
            className={IOS_LIQUID_CTA_CLASS}
          >
            OK
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onConfirm}
              className={IOS_LIQUID_CTA_CLASS}
            >
              Add
            </button>
            <button
              type="button"
              onClick={onClose}
              className={CONFIRM_CANCEL_BUTTON_CLASS}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </ModalFrame>
  );
}
