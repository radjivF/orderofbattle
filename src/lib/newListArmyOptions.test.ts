import { describe, expect, it } from "vitest";
import { listArmiesOfRenown } from "@/engine/queries";
import { listSpearheadsForFaction } from "@/engine/spearhead";
import {
  encodeNewListArmyValue,
  newListArmySelectGroups,
  newListArmySelectHasExtras,
  parseNewListArmyValue,
} from "./newListArmyOptions";

describe("newListArmySelectGroups", () => {
  it("groups Stormcast as faction, Army of Renown, and Spearhead", () => {
    const groups = newListArmySelectGroups("stormcast-eternals");
    const labels = groups.map((group) => group.label);
    expect(labels).toEqual([
      "Stormcast Eternals",
      "Army of Renown",
      "Spearhead",
      "Path to Glory",
    ]);

    const aorIds = listArmiesOfRenown("stormcast-eternals").map((item) => item.id);
    const spearheadIds = listSpearheadsForFaction("stormcast-eternals").map(
      (item) => item.id,
    );
    expect(groups[1]?.options.map((item) => item.value)).toEqual(aorIds);
    expect(
      groups[2]?.options.map((item) => parseNewListArmyValue(item.value)),
    ).toEqual(
      spearheadIds.map((spearheadId) => ({
        kind: "spearhead",
        spearheadId,
      })),
    );
    expect(groups[2]?.options.map((item) => item.label)).toContain(
      "Vigilant Brotherhood",
    );
  });

  it("treats Stormcast as having Army of Renown and Spearhead extras", () => {
    expect(newListArmySelectHasExtras("stormcast-eternals")).toBe(true);
    expect(newListArmySelectHasExtras("not-a-faction")).toBe(false);
  });
});

describe("newList army select values", () => {
  it("round-trips spearhead values without colliding with faction ids", () => {
    const encoded = encodeNewListArmyValue({
      kind: "spearhead",
      spearheadId: "stormcast-eternals-vigilant-brotherhood",
    });
    expect(encoded.startsWith("spearhead:")).toBe(true);
    expect(parseNewListArmyValue(encoded)).toEqual({
      kind: "spearhead",
      spearheadId: "stormcast-eternals-vigilant-brotherhood",
    });
    expect(parseNewListArmyValue("stormcast-eternals")).toEqual({
      kind: "matched",
      factionId: "stormcast-eternals",
    });
  });

  it("round-trips Path to Glory values onto the chosen army", () => {
    const encoded = encodeNewListArmyValue({
      kind: "pathToGlory",
      factionId: "stormcast-eternals",
      battlepackPreset: "ravaged-coast",
    });
    expect(parseNewListArmyValue(encoded)).toEqual({
      kind: "pathToGlory",
      factionId: "stormcast-eternals",
      battlepackPreset: "ravaged-coast",
    });
  });

  it("encodes Path to Glory onto an Army of Renown when that army is selected", () => {
    const aorId = listArmiesOfRenown("stormcast-eternals")[0]?.id;
    expect(aorId).toBeTruthy();
    if (!aorId) return;

    const groups = newListArmySelectGroups("stormcast-eternals", aorId);
    const pathGroup = groups.find((group) => group.label === "Path to Glory");
    const ravaged = pathGroup?.options.find((item) =>
      item.label.startsWith("Ravaged Coast"),
    );
    expect(parseNewListArmyValue(ravaged?.value ?? "")).toEqual({
      kind: "pathToGlory",
      factionId: aorId,
      battlepackPreset: "ravaged-coast",
    });
  });
});