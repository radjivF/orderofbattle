import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// jsdom does not implement scrollTo; scroll lock restores position on modal close.
Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
  configurable: true,
});

// jsdom does not implement scrollTo; scroll lock restores position on modal close.
Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
  configurable: true,
});
