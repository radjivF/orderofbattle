"use client";

import {
  CONFIRM_CANCEL_BUTTON_CLASS,
  CONFIRM_DESTRUCTIVE_BUTTON_CLASS,
  CONFIRM_SHEET_ACTIONS_CLASS,
} from "@/lib/builderUi";

type Props = {
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmSheetActions({
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className={CONFIRM_SHEET_ACTIONS_CLASS}>
      <button
        type="button"
        onClick={onConfirm}
        className={CONFIRM_DESTRUCTIVE_BUTTON_CLASS}
      >
        {confirmLabel}
      </button>
      <button type="button" onClick={onCancel} className={CONFIRM_CANCEL_BUTTON_CLASS}>
        Cancel
      </button>
    </div>
  );
}
