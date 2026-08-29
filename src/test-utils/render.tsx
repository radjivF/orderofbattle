import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

export function renderUi(ui: ReactElement, options?: RenderOptions) {
  return render(ui, options);
}

export * from "@testing-library/react";
