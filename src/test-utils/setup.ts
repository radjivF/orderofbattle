import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom does not implement scrollTo; scroll lock restores position on modal close.
Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
  configurable: true,
});
