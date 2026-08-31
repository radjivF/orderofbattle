import { describe, expect, it, vi } from "vitest";
import { getFaction } from "@/engine/queries";
import { render, screen } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import { PathToGloryUnitExtras } from "./PathToGloryUnitExtras";

describe("PathToGloryUnitExtras Anvil forge", () => {
  it("opens a forge sheet to pick Chamber, origin, flaw, and mount", async () => {
    const user = userEvent.setup();
    const faction = getFaction("stormcast-eternals");
    const anvil = faction?.units.find(
      (unit) => unit.name === "Anvil of Apotheosis: Stormcast Eternals Hero",
    );
    expect(anvil).toBeTruthy();
    if (!anvil) {
      return;
    }
    const onChange = vi.fn();
    render(
      <PathToGloryUnitExtras
        selection={{
          id: "hero-1",
          unitId: anvil.id,
          reinforced: false,
          pathToGlory: {
            renown: 5,
            pathId: null,
            pathOptionIds: [],
            battleWoundId: null,
            scarId: null,
            anvilRankId: anvil.anvilRanks?.[0]?.id ?? null,
            anvilPickIds: [],
          },
        }}
        unit={anvil}
        packIds={["ascension"]}
        showBattleWounds={false}
        onChange={onChange}
        onOpenDatasheet={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText(/^chamber$/i)).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /forge anvil of apotheosis/i }),
    );
    expect(screen.getByLabelText(/hero rank/i)).toBeInTheDocument();
    const chamber = screen.getByLabelText(/^chamber$/i);
    expect(chamber).toBeInTheDocument();
    expect(screen.getByLabelText(/^origins$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^flaws$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/battle mount/i)).toBeInTheDocument();
    expect(screen.getByText(/destiny/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/battle mount upgrades/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /anvil of apotheosis: stormcast eternals hero datasheet/i,
      }),
    ).toBeInTheDocument();

    const vanguard = anvil.anvilForge
      ?.find((group) => group.name === "Chamber")
      ?.options.find((item) => item.name === "Vanguard Chamber");
    expect(vanguard).toBeTruthy();
    await user.selectOptions(chamber, vanguard!.id);
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls.at(-1)?.[0];
    expect(next?.pathToGlory?.anvilPickIds).toContain(vanguard!.id);
  });
});
