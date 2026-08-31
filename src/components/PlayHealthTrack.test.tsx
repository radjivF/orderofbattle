import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@/test-utils/render";
import type { SelectionPlayState } from "@/engine/queries";
import { PlayHealthTrack } from "./PlayHealthTrack";

function track(overrides: Partial<SelectionPlayState> = {}): SelectionPlayState {
  return {
    damage: 0,
    health: 8,
    healthMax: 8,
    healthPerModel: 8,
    models: 1,
    modelsMax: 1,
    ...overrides,
  };
}

describe("PlayHealthTrack", () => {
  beforeEach(() => {
    cleanup();
  });

  it("shows remaining wounds against the total", () => {
    render(
      <PlayHealthTrack
        aside
        track={track({ damage: 5, health: 3, healthMax: 8 })}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("3 / 8 hp"));
  });

  it("shows full remaining when undamaged", () => {
    render(
      <PlayHealthTrack aside track={track()} onChange={vi.fn()} />,
    );

    expect(screen.getByText("8 / 8 hp"));
  });

  it("keeps remaining wounds on the inline track", () => {
    render(
      <PlayHealthTrack
        track={track({ damage: 2, health: 6, healthMax: 8 })}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("6 / 8 hp"));
  });

  it("drops remaining hp when damage is added", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [damage, setDamage] = useState(0);
      return (
        <PlayHealthTrack
          aside
          track={track({
            damage,
            health: 8 - damage,
            healthMax: 8,
          })}
          onChange={setDamage}
        />
      );
    }

    render(<Harness />);
    expect(screen.getByText("8 / 8 hp"));
    await user.click(screen.getByRole("button", { name: "+" }));
    expect(screen.getByText("7 / 8 hp"));
  });

  it("shows only models left for multi-model units", () => {
    render(
      <PlayHealthTrack
        aside
        track={track({
          damage: 8,
          health: 12,
          healthMax: 20,
          healthPerModel: 1,
          models: 12,
          modelsMax: 20,
        })}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("12/20 models"));
    expect(screen.queryByText("12 / 20 hp")).toBeNull();
  });
});
