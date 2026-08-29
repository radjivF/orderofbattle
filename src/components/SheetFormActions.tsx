"use client";

import {
  CONFIRM_CANCEL_BUTTON_CLASS,
  IOS_LIQUID_CTA_CLASS,
  SHEET_FORM_ACTIONS_CLASS,
} from "@/lib/builderUi";

type Props = {
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
};

export function SheetFormActions({
  primaryLabel,
  onPrimary,
  secondaryLabel = "Cancel",
  onSecondary,
  primaryDisabled = false,
  secondaryDisabled = false,
}: Props) {
  return (
    <div className={SHEET_FORM_ACTIONS_CLASS}>
      <button
        type="button"
        onClick={onPrimary}
        disabled={primaryDisabled}
        className={`${IOS_LIQUID_CTA_CLASS} disabled:opacity-60`}
      >
        {primaryLabel}
      </button>
      {onSecondary ? (
        <button
          type="button"
          onClick={onSecondary}
          disabled={secondaryDisabled}
          className={`${CONFIRM_CANCEL_BUTTON_CLASS} disabled:opacity-60`}
        >
          {secondaryLabel}
        </button>
      ) : null}
    </div>
  );
}
