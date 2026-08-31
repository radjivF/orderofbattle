"use client";

import { useState } from "react";
import {
  IOS_LIQUID_CTA_CLASS,
  RULE_INFO_BUTTON_CLASS,
  SHEET_PANEL_COMPACT_CLASS,
} from "@/lib/builderUi";
import { IosInfoIcon } from "./ios/SheetIconButton";
import { ModalFrame } from "./ModalFrame";

type Props = {
  label: string;
  title: string;
  text: string;
};

export function RuleInfoButton({ label, title, text }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={RULE_INFO_BUTTON_CLASS}
        aria-label={label}
      >
        <IosInfoIcon />
      </button>
      {open ? (
        <ModalFrame
          label={label}
          onClose={() => setOpen(false)}
          panelClassName={`${SHEET_PANEL_COMPACT_CLASS} p-5`}
        >
          <h2 className="font-serif text-2xl">{title}</h2>
          <p className="mt-3 text-base leading-relaxed text-sheet-muted">
            {text}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`mt-5 ${IOS_LIQUID_CTA_CLASS}`}
          >
            Got it
          </button>
        </ModalFrame>
      ) : null}
    </>
  );
}
