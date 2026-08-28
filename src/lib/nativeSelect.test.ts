import { describe, expect, it, vi } from "vitest";
import { openNativeSelect } from "./nativeSelect";

describe("openNativeSelect", () => {
  it("no-ops when the element is missing", () => {
    expect(() => openNativeSelect(null)).not.toThrow();
  });

  it("focuses and opens the native picker", () => {
    const showPicker = vi.fn();
    const el = {
      focus: vi.fn(),
      showPicker,
    } as unknown as HTMLSelectElement;
    openNativeSelect(el);
    expect(el.focus).toHaveBeenCalled();
    expect(showPicker).toHaveBeenCalled();
  });

  it("still focuses when showPicker throws", () => {
    const el = {
      focus: vi.fn(),
      showPicker: () => {
        throw new Error("not allowed");
      },
    } as unknown as HTMLSelectElement;
    expect(() => openNativeSelect(el)).not.toThrow();
    expect(el.focus).toHaveBeenCalled();
  });
});
