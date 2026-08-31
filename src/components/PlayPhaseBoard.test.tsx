import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { createId } from "@/lib/id";
import { blankArmy, blankSpearhead } from "@/lib/storage";
import { getFaction } from "@/engine/queries";
import { getSpearhead, spearheadAsFaction } from "@/engine/spearhead";
import { cleanup, render, screen, within } from "@/test-utils/render";
import { PlayPhaseBoard } from "./PlayPhaseBoard";

function listWithNamedHero(factionId: string, unitName: string) {
  const faction = getFaction(factionId);
  expect(faction).toBeTruthy();
  if (!faction) {
    throw new Error(`missing catalogue ${factionId}`);
  }
  const hero = faction.units.find((unit) => unit.name === unitName);
  expect(hero).toBeTruthy();
  if (!hero) {
    throw new Error(`missing unit ${unitName}`);
  }
  const list = {
    ...blankArmy(faction.id),
    generalRegimentId: "reg-1",
    regiments: [
      {
        id: "reg-1",
        hero: { id: createId(), unitId: hero.id, reinforced: false },
        units: [],
      },
    ],
  };
  return { faction, hero, list };
}

function stormcastPlayList() {
  const faction = getFaction("stormcast-eternals");
  expect(faction).toBeTruthy();
  if (!faction) {
    throw new Error("missing stormcast catalogue");
  }
  const hero = faction.units.find((unit) => unit.hero);
  expect(hero).toBeTruthy();
  if (!hero) {
    throw new Error("missing stormcast hero");
  }
  return listWithNamedHero(faction.id, hero.name);
}

async function openPhase(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(
    within(screen.getByRole("tablist", { name: "Battle phases" })).getByRole(
      "tab",
      { name },
    ),
  );
  const sections = screen.queryByRole("tablist", {
    name: `${name} sections`,
  });
  const abilitiesTab = sections
    ? within(sections).queryByRole("tab", { name: "Abilities" })
    : null;
  if (abilitiesTab) {
    await user.click(abilitiesTab);
  }
}

describe("PlayPhaseBoard", () => {
  beforeEach(() => {
    cleanup();
  });

  it("shows core play phase tabs", () => {
    const { faction, list } = stormcastPlayList();
    render(
      <PlayPhaseBoard list={list} faction={faction} onOpenSheet={vi.fn()} />,
    );

    expect(screen.getByRole("tablist", { name: "Battle phases" }));
    expect(screen.getByRole("tab", { name: "Army" }));
    expect(screen.getByRole("tab", { name: "Hero" }));
    expect(
      screen.queryByRole("tab", { name: "Start of turn" }),
    ).not.toBeInTheDocument();
  });

  it("shows Start of turn for Sylvaneth Creeping Dread", async () => {
    const user = userEvent.setup();
    const { faction, list } = listWithNamedHero("sylvaneth", "Arch-Revenant");
    render(
      <PlayPhaseBoard list={list} faction={faction} onOpenSheet={vi.fn()} />,
    );

    await openPhase(user, "Start of turn");
    expect(screen.getByText("Creeping Dread").closest("li")).toBeTruthy();
  });

  it("shows a datasheet control on movement units so the sheet is obvious", async () => {
    const user = userEvent.setup();
    const onOpenSheet = vi.fn();
    const { faction, hero, list } = stormcastPlayList();
    render(
      <PlayPhaseBoard
        list={list}
        faction={faction}
        onOpenSheet={onOpenSheet}
      />,
    );

    await user.click(
      within(screen.getByRole("tablist", { name: "Battle phases" })).getByRole(
        "tab",
        { name: "Movement" },
      ),
    );
    const openSheet = screen.getByRole("button", {
      name: `${hero.name} datasheet`,
    });
    await user.click(openSheet);
    expect(onOpenSheet).toHaveBeenCalledTimes(1);
  });

  it("lets you remove a destroyed unit from this phase", async () => {
    const user = userEvent.setup();
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) {
      throw new Error("missing sylvaneth catalogue");
    }
    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    const companion = faction.units.find((unit) => unit.name === "Treelord");
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) {
      throw new Error("missing sylvaneth units");
    }

    const list = {
      ...blankArmy(faction.id),
      generalRegimentId: "reg-1",
      regiments: [
        {
          id: "reg-1",
          hero: {
            id: createId(),
            unitId: hero.id,
            reinforced: false,
            play: { damage: 99 },
          },
          units: [
            { id: createId(), unitId: companion.id, reinforced: false },
          ],
        },
      ],
    };

    render(
      <PlayPhaseBoard list={list} faction={faction} onOpenSheet={vi.fn()} />,
    );

    await user.click(
      within(screen.getByRole("tablist", { name: "Battle phases" })).getByRole(
        "tab",
        { name: "Movement" },
      ),
    );

    expect(
      screen.getByRole("button", { name: `${hero.name} datasheet` }),
    );
    expect(
      screen.queryByRole("button", {
        name: `Remove ${companion.name} from this phase`,
      }),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", {
        name: `Remove ${hero.name} from this phase`,
      }),
    );

    expect(
      screen.queryByRole("button", { name: `${hero.name} datasheet` }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: `${companion.name} datasheet` }),
    );
  });

  it("keeps the first removed unit hidden when another is removed", async () => {
    const user = userEvent.setup();
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) {
      throw new Error("missing sylvaneth catalogue");
    }
    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    const companion = faction.units.find((unit) => unit.name === "Treelord");
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) {
      throw new Error("missing sylvaneth units");
    }

    const list = {
      ...blankArmy(faction.id),
      generalRegimentId: "reg-1",
      regiments: [
        {
          id: "reg-1",
          hero: {
            id: createId(),
            unitId: hero.id,
            reinforced: false,
            play: { damage: 99 },
          },
          units: [
            {
              id: createId(),
              unitId: companion.id,
              reinforced: false,
              play: { damage: 99 },
            },
          ],
        },
      ],
    };

    render(
      <PlayPhaseBoard list={list} faction={faction} onOpenSheet={vi.fn()} />,
    );

    await user.click(
      within(screen.getByRole("tablist", { name: "Battle phases" })).getByRole(
        "tab",
        { name: "Movement" },
      ),
    );

    await user.click(
      screen.getByRole("button", {
        name: `Remove ${hero.name} from this phase`,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: `Remove ${companion.name} from this phase`,
      }),
    );

    expect(
      screen.queryByRole("button", { name: `${hero.name} datasheet` }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: `${companion.name} datasheet` }),
    ).toBeNull();
  });

  it("brings a revived unit back onto Movement", async () => {
    const user = userEvent.setup();
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) {
      throw new Error("missing sylvaneth catalogue");
    }
    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    expect(hero).toBeTruthy();
    if (!hero) {
      throw new Error("missing sylvaneth hero");
    }
    const heroSelectionId = createId();
    const deadList = {
      ...blankArmy(faction.id),
      generalRegimentId: "reg-1",
      regiments: [
        {
          id: "reg-1",
          hero: {
            id: heroSelectionId,
            unitId: hero.id,
            reinforced: false,
            play: { damage: 99 },
          },
          units: [],
        },
      ],
    };

    const { rerender } = render(
      <PlayPhaseBoard
        list={deadList}
        faction={faction}
        onOpenSheet={vi.fn()}
      />,
    );

    await user.click(
      within(screen.getByRole("tablist", { name: "Battle phases" })).getByRole(
        "tab",
        { name: "Movement" },
      ),
    );
    await user.click(
      screen.getByRole("button", {
        name: `Remove ${hero.name} from this phase`,
      }),
    );
    expect(
      screen.queryByRole("button", { name: `${hero.name} datasheet` }),
    ).toBeNull();

    rerender(
      <PlayPhaseBoard
        list={{
          ...deadList,
          regiments: [
            {
              ...deadList.regiments[0]!,
              hero: {
                id: heroSelectionId,
                unitId: hero.id,
                reinforced: false,
                play: { damage: 0 },
              },
            },
          ],
        }}
        faction={faction}
        onOpenSheet={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: `${hero.name} datasheet` }),
    );
    expect(
      screen.queryByRole("button", {
        name: `Remove ${hero.name} from this phase`,
      }),
    ).toBeNull();
  });

  it("puts Move on the same row as the unit name, to the right", async () => {
    const user = userEvent.setup();
    const { faction, hero, list } = stormcastPlayList();
    render(
      <PlayPhaseBoard
        list={list}
        faction={faction}
        onOpenSheet={vi.fn()}
      />,
    );

    await user.click(
      within(screen.getByRole("tablist", { name: "Battle phases" })).getByRole(
        "tab",
        { name: "Movement" },
      ),
    );

    const openSheet = screen.getByRole("button", {
      name: `${hero.name} datasheet`,
    });
    const move = within(openSheet).getByText(/^Move /);
    expect(move.className).not.toContain("mt-1");
    expect(move.parentElement?.className).toContain("items-baseline");
    expect(move.parentElement?.className).toContain("justify-between");
  });

  it("shows Vampire Lord Sanguine Blur on Hero", async () => {
    const user = userEvent.setup();
    const { faction, list } = listWithNamedHero(
      "soulblight-gravelords",
      "Vampire Lord",
    );
    render(
      <PlayPhaseBoard list={list} faction={faction} onOpenSheet={vi.fn()} />,
    );

    await openPhase(user, "Hero");
    expect(screen.getByText("Sanguine Blur"));
  });

  it("shows Zombie Dragon Bloodthirsty Dominance and The Hunger on End of turn", async () => {
    const user = userEvent.setup();
    const { faction, list } = listWithNamedHero(
      "soulblight-gravelords",
      "Vampire Lord on Zombie Dragon",
    );
    render(
      <PlayPhaseBoard list={list} faction={faction} onOpenSheet={vi.fn()} />,
    );

    await openPhase(user, "End of turn");
    expect(screen.getByText("Bloodthirsty Dominance"));
    expect(screen.getByText("The Hunger"));
  });

  it("shows Swampcalla Foul Elixirs on Hero", async () => {
    const user = userEvent.setup();
    const { faction, list } = listWithNamedHero(
      "kruleboyz",
      "Swampcalla Shaman with Pot-grot",
    );
    render(
      <PlayPhaseBoard list={list} faction={faction} onOpenSheet={vi.fn()} />,
    );

    await openPhase(user, "Hero");
    expect(screen.getByText("Foul Elixirs"));
  });

  it("shows Trailblazers Endrinmaster Extraordinaire on Hero", async () => {
    const user = userEvent.setup();
    const box = getSpearhead("kharadron-overlords-grundstok-trailblazers");
    expect(box).toBeTruthy();
    if (!box) {
      throw new Error("missing Trailblazers spearhead");
    }
    const faction = spearheadAsFaction(box);
    const list = blankSpearhead(box.id);
    render(
      <PlayPhaseBoard list={list} faction={faction} onOpenSheet={vi.fn()} />,
    );

    await openPhase(user, "Hero");
    expect(screen.getByText("ENDRINMASTER EXTRAORDINAIRE"));
  });
});
