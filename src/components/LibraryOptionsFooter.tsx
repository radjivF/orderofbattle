"use client";

import type { PortableFormat } from "@/engine/listPortable";
import {
  CONFIRM_CANCEL_BUTTON_CLASS,
  IOS_LIQUID_CTA_CLASS,
  LIST_ISSUE_BANNER_CLASS,
  MODAL_SHEET_FOOTER_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
} from "@/lib/builderUi";

type ImportProps = {
  kind: "import";
  draft: string;
  onImport: () => void;
  onChooseFile: () => void;
};

type ExportPickProps = {
  kind: "export-pick";
  error: string | null;
  onContinue: () => void;
};

type ExportPreviewProps = {
  kind: "export-preview";
  copied: boolean;
  format: PortableFormat;
  onCopy: () => void;
  onDownload: () => void;
  onBack: () => void;
};

type Props = ImportProps | ExportPickProps | ExportPreviewProps;

export function LibraryOptionsFooter(props: Props) {
  if (props.kind === "import") {
    return (
      <div className={MODAL_SHEET_FOOTER_CLASS}>
        <button
          type="button"
          disabled={props.draft.trim().length === 0}
          onClick={props.onImport}
          className={IOS_LIQUID_CTA_CLASS}
        >
          Import
        </button>
        <button
          type="button"
          onClick={props.onChooseFile}
          className={SHEET_SECONDARY_BUTTON_CLASS}
        >
          Choose file
        </button>
      </div>
    );
  }

  if (props.kind === "export-pick") {
    return (
      <div className={MODAL_SHEET_FOOTER_CLASS}>
        {props.error ? (
          <p role="alert" className={LIST_ISSUE_BANNER_CLASS}>
            {props.error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={props.onContinue}
          className={IOS_LIQUID_CTA_CLASS}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className={MODAL_SHEET_FOOTER_CLASS}>
      <button
        type="button"
        onClick={props.onCopy}
        className={IOS_LIQUID_CTA_CLASS}
      >
        {props.copied ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={props.onDownload}
        className={SHEET_SECONDARY_BUTTON_CLASS}
      >
        {props.format === "json" ? "Download .json" : "Download .txt"}
      </button>
      <button
        type="button"
        onClick={props.onBack}
        className={CONFIRM_CANCEL_BUTTON_CLASS}
      >
        Back
      </button>
    </div>
  );
}
