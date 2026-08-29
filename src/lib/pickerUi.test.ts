import { describe, expect, it } from "vitest";
import { filterPickerUnits } from "./pickerUi";

describe("filterPickerUnits", () => {
  it("returns all units when query is blank", () => {
    const units = [{ id: "a", name: "Annihilators" }] as never[];
    expect(filterPickerUnits(units, "   ")).toBe(units);
  });

  it("filters by case-insensitive substring", () => {
    const units = [
      { id: "a", name: "Annihilators" },
      { id: "b", name: "Liberators" },
    ] as never[];
    expect(filterPickerUnits(units, "anni")).toEqual([units[0]]);
  });
});
