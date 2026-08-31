import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { blankArmy } from "@/engine/listFactories";
import { listRegimentsOfRenown } from "@/engine/queries";
import { createId } from "@/lib/id";
import { cleanup, render, screen } from "@/test-utils/render";
import {
  buildRoRSelections,
  RegimentOfRenownCard,
} from "./RegimentOfRenownCard";

function gloomspiteRorList() {
  const ror = listRegimentsOfRenown("gloomspite-gitz").find(
    (item) => item.abilities.length > 0 && item.abilities[0]?.effect,
  );
  expect(ror).toBeTruthy();
  if (!ror) {
    throw new Error("missing gloomspite Regiment of Renown");
  }
  const pick = buildRoRSelections(ror.id, createId);
  expect(pick).toBeTruthy();
  if (!pick) {
    throw new Error("missing RoR selections");
  }
  return {
    ror,
    list: { ...blankArmy("gloomspite-gitz"), regimentOfRenown: pick },
  };
}

describe("RegimentOfRenownCard", () => {
  beforeEach(() => {
    cleanup();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  it("opens package rules from a datasheet icon instead of listing them", async () => {
    const user = userEvent.setup();
    const { ror, list } = gloomspiteRorList();
    const onOpenDatasheet = vi.fn();
    const effect = ror.abilities[0]?.effect ?? "";

    render(
      <RegimentOfRenownCard
        list={list}
        playMode={false}
        onOpenDatasheet={onOpenDatasheet}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.queryByText(effect)).toBeNull();
    await user.click(
      screen.getByRole("button", { name: `${ror.name} datasheet` }),
    );
    expect(onOpenDatasheet).toHaveBeenCalledWith(ror);
  });
});
