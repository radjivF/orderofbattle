import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  libraryCardPressHoldsOn,
  libraryCreatingSplashVisible,
  listFlowBackHref,
  listFlowHeaderMode,
  listFlowIsDetail,
  listFlowIsHome,
  listFlowSkipsPostRouteSlide,
  listFlowTrackClass,
  listFlowWindowScrollY,
  listFlowShowsFactionBackdrop,
  listFlowFactionBackdropFaded,
  listFlowIndexBackdropRevealed,
  listFlowPendingRouteSplash,
  listOpenNeedsSplash,
  listOpenShowsSplash,
  listOpenDisplayNameForHeader,
  listOpenSplashFactionName,
  listOpenUsesInAppSlide,
  resolveBuilderHeaderDisplay,
} from "./listFlowNav";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("listOpenDisplayNameForHeader", () => {
  it("uses the custom list name, not the faction catalogue name", () => {
    expect(
      listOpenDisplayNameForHeader({ name: "  My Stormhost  " }),
    ).toBe("My Stormhost");
    expect(listOpenDisplayNameForHeader({ name: "Cardone" })).toBe("Cardone");
  });
});

describe("listOpenSplashFactionName", () => {
  it("shows the faction catalogue name, not the custom list name", () => {
    expect(
      listOpenSplashFactionName({
        catalogueName: "Daughters of Khaine",
        rememberedFactionName: "Daughters of Khaine",
        listNameFallback: "My Daughters of Khaine",
      }),
    ).toBe("Daughters of Khaine");
  });

  it("uses parent faction for spearhead lists", () => {
    expect(
      listOpenSplashFactionName({
        list: {
          factionId: "stormcast-eternals",
          kind: "spearhead",
          spearheadId: "vigilant-brotherhood",
        },
        catalogueName: "Vigilant Brotherhood",
        parentFactionName: "Stormcast Eternals",
        listNameFallback: "My Spearhead",
      }),
    ).toBe("Stormcast Eternals");
  });
});

describe("resolveBuilderHeaderDisplay", () => {
  it("shows remembered custom name before BuilderChrome hydrates", () => {
    expect(
      resolveBuilderHeaderDisplay({
        rememberedDisplayName: "Cardone",
        chrome: null,
        stored: null,
      }),
    ).toEqual({
      listName: "Cardone",
      inputValue: "Cardone",
      points: 0,
      pointsCap: 2000,
      drops: 0,
      showPlayButton: true,
    });
  });

  it("shows stored points and Play before BuilderChrome hydrates", () => {
    expect(
      resolveBuilderHeaderDisplay({
        rememberedDisplayName: "Cardone",
        chrome: null,
        stored: { points: 1840, pointsCap: 2000, drops: 3 },
      }),
    ).toMatchObject({
      listName: "Cardone",
      points: 1840,
      pointsCap: 2000,
      drops: 3,
      showPlayButton: true,
    });
  });

  it("prefers live chrome once BuilderScreen publishes it", () => {
    expect(
      resolveBuilderHeaderDisplay({
        rememberedDisplayName: "Old name",
        chrome: {
          listName: "Cardone",
          points: 1900,
          pointsCap: 2000,
          drops: 4,
          playMode: false,
        },
        stored: { points: 100, pointsCap: 2000, drops: 1 },
      }),
    ).toMatchObject({
      listName: "Cardone",
      points: 1900,
      drops: 4,
      showPlayButton: true,
    });
  });

  it("hides Play in play mode", () => {
    expect(
      resolveBuilderHeaderDisplay({
        rememberedDisplayName: "Cardone",
        chrome: {
          listName: "Cardone",
          points: 1900,
          pointsCap: 2000,
          drops: 4,
          playMode: true,
        },
        stored: null,
      }).showPlayButton,
    ).toBe(false);
  });
});

describe("listFlowHeaderMode", () => {
  it("keeps the builder header during back animation so the library does not flash through", () => {
    expect(
      listFlowHeaderMode({
        isBuilder: true,
        showDetail: false,
        animatingBack: true,
      }),
    ).toBe("builder");
  });

  it("keeps the library header on a live battle so back lives next to the match title", () => {
    expect(
      listFlowHeaderMode({
        isBuilder: false,
        showDetail: false,
        animatingBack: true,
      }),
    ).toBe("library");
    expect(
      listFlowHeaderMode({
        isBuilder: false,
        showDetail: true,
        animatingBack: false,
      }),
    ).toBe("library");
  });

  it("keeps the builder header once the list detail pane is showing", () => {
    expect(
      listFlowHeaderMode({
        isBuilder: true,
        showDetail: true,
        animatingBack: false,
        settled: false,
      }),
    ).toBe("builder");
  });

  it("shows the library header on /dashboard", () => {
    expect(
      listFlowHeaderMode({
        isBuilder: false,
        showDetail: false,
        animatingBack: false,
      }),
    ).toBe("library");
  });
});

describe("listFlowIsHome", () => {
  it("treats only the marketing root as home", () => {
    expect(listFlowIsHome("/")).toBe(true);
    expect(listFlowIsHome("/dashboard")).toBe(false);
    expect(listFlowIsHome("/lists/abc")).toBe(false);
  });
});

describe("listFlowIsDetail", () => {
  it("slides a battle the same way as a list", () => {
    expect(listFlowIsDetail("/dashboard")).toBe(false);
    expect(listFlowIsDetail("/battle-record")).toBe(false);
    expect(listFlowIsDetail("/lists/abc")).toBe(true);
    expect(listFlowIsDetail("/battle-record/game-1")).toBe(true);
    expect(listFlowBackHref("/lists/abc")).toBe("/dashboard");
    expect(listFlowBackHref("/battle-record/game-1")).toBe("/battle-record");
  });
});

describe("listOpenUsesInAppSlide", () => {
  it("starts the slide on a normal press, not a modified click", () => {
    const tap = {
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      button: 0,
    };
    expect(listOpenUsesInAppSlide(tap)).toBe(true);
    expect(listOpenUsesInAppSlide({ ...tap, metaKey: true })).toBe(false);
    expect(listOpenUsesInAppSlide({ ...tap, button: 1 })).toBe(false);
  });
});

describe("listFlowSkipsPostRouteSlide", () => {
  it("does not replay the slide after the route catches up", () => {
    expect(listFlowSkipsPostRouteSlide(true)).toBe(true);
    expect(listFlowSkipsPostRouteSlide(false)).toBe(false);
  });
});

describe("libraryCardPressHoldsOn", () => {
  it("holds the press on list details and releases back on My lists", () => {
    expect(libraryCardPressHoldsOn("/lists/abc")).toBe(true);
    expect(libraryCardPressHoldsOn("/dashboard")).toBe(false);
    expect(libraryCardPressHoldsOn("/")).toBe(false);
  });
});

describe("listFlowTrackClass", () => {
  it("slides the library pane off-screen when detail is visible", () => {
    expect(listFlowTrackClass(false)).toBe(
      "list-flow-track list-flow-track--settled",
    );
    expect(listFlowTrackClass(true)).toBe(
      "list-flow-track list-flow-track--detail list-flow-track--settled",
    );
  });

  it("keeps both panes tall while the slide is running", () => {
    expect(listFlowTrackClass(false, false)).toBe("list-flow-track");
    expect(listFlowTrackClass(true, false)).toBe(
      "list-flow-track list-flow-track--detail",
    );
  });
});

describe("listOpenNeedsSplash", () => {
  it("covers the list only until data is ready", () => {
    expect(listOpenNeedsSplash(false)).toBe(true);
    expect(listOpenNeedsSplash(true)).toBe(false);
  });
});

describe("listFlowPendingRouteSplash", () => {
  it("covers the slide only until the list page mounts", () => {
    expect(listFlowPendingRouteSplash(true, false)).toBe(true);
    expect(listFlowPendingRouteSplash(true, true)).toBe(false);
    expect(listFlowPendingRouteSplash(false, false)).toBe(false);
  });
});

describe("listFlowShowsFactionBackdrop", () => {
  it("keeps list art mounted while sliding back so it can fade", () => {
    expect(
      listFlowShowsFactionBackdrop({
        hasBackdrop: true,
        isBuilder: true,
        returningToLibrary: false,
      }),
    ).toBe(true);
    expect(
      listFlowShowsFactionBackdrop({
        hasBackdrop: true,
        isBuilder: true,
        returningToLibrary: true,
      }),
    ).toBe(true);
    expect(
      listFlowShowsFactionBackdrop({
        hasBackdrop: true,
        isBuilder: false,
        returningToLibrary: true,
      }),
    ).toBe(true);
    expect(
      listFlowShowsFactionBackdrop({
        hasBackdrop: true,
        isBuilder: false,
        returningToLibrary: false,
      }),
    ).toBe(false);
  });
});

describe("listFlowFactionBackdropFaded", () => {
  it("fades list art out while returning to My lists", () => {
    expect(listFlowFactionBackdropFaded(false)).toBe(false);
    expect(listFlowFactionBackdropFaded(true)).toBe(true);
  });
});

describe("listFlowIndexBackdropRevealed", () => {
  it("keeps library art painted so going back does not flash ink", () => {
    expect(listFlowIndexBackdropRevealed()).toBe(true);
  });
});

describe("listOpenShowsSplash", () => {
  it("covers the incoming list even when armies are already cached", () => {
    expect(
      listOpenShowsSplash({ splashRequested: true, animatingBack: false }),
    ).toBe(true);
    expect(
      listOpenShowsSplash({ splashRequested: true, animatingBack: true }),
    ).toBe(false);
  });
});

describe("libraryCreatingSplashVisible", () => {
  it("keeps the create splash until the builder clears it", () => {
    expect(libraryCreatingSplashVisible(true, false)).toBe(true);
    expect(libraryCreatingSplashVisible(false, true)).toBe(true);
    expect(libraryCreatingSplashVisible(false, false)).toBe(false);
  });
});

describe("listFlowWindowScrollY", () => {
  it("resets to the top of the list and restores the library on the way back", () => {
    expect(
      listFlowWindowScrollY({ showingDetail: true, libraryScrollY: 1909 }),
    ).toBe(0);
    expect(
      listFlowWindowScrollY({ showingDetail: false, libraryScrollY: 1909 }),
    ).toBe(1909);
  });
});

describe("list flow navigation wiring", () => {
  it("stores the list name when opening from the library", () => {
    const library = readSource("components/LibraryCreateFlow.tsx");
    const libraryCard = readSource("components/LibraryListCard.tsx");
    expect(libraryCard).toContain("listOpenDisplayNameForHeader(list)");
    expect(libraryCard).toContain("rememberOpenList(list)");
    expect(libraryCard).toContain("goForward");
    expect(libraryCard).toContain("preventDefault");
    expect(library).toContain("rememberListCreate");
    expect(libraryCard).not.toContain("rememberOpenList(list.factionId)");
    expect(libraryCard).not.toContain("rememberListOpen(artId, faction?.name)");
    expect(library).toContain("libraryCreatingSplashVisible");
  });

  it("keeps the library mounted in the carousel shell", () => {
    const shell = readSource("components/ListFlowShell.tsx");
    const dashboard = readSource("app/(flow)/dashboard/page.tsx");
    const nav = readSource("components/IosNavSlide.tsx");

    expect(shell).toContain('libraryLayer={<LibraryScreen />}');
    expect(shell).toContain("listFlowHeaderMode");
    expect(shell).toContain("listFlowIsHome");
    expect(shell).toContain("hidden={isHome}");
    const home = readSource("app/(flow)/page.tsx");
    expect(home).toContain("TryLanding");
    expect(dashboard).toContain("return null");
    expect(nav).toContain("listFlowIsHome");
    expect(nav).toContain("listFlowTrackClass");
    expect(nav).toContain("listFlowTrackClass(showDetail, settled)");
    expect(nav).toContain("listFlowIsDetail");
    expect(nav).toContain("listFlowBackHref");
    const battlePage = readSource("app/(flow)/battle-record/[id]/page.tsx");
    const battleList = readSource("components/BattleRecordScreen.tsx");
    const battleHost = readSource("components/BattleRecordHost.tsx");
    expect(battlePage).toContain("BattleRecordGameScreen");
    expect(battleList).toContain("goForward");
    expect(battleList).toContain("listOpenUsesInAppSlide");
    expect(battleHost).not.toContain("BattleRecordGameScreen");
    const battleGame = readSource("components/BattleRecordGameScreen.tsx");
    expect(battleGame).toContain("listFlowTrackClass(editOpen, editSettled)");
    expect(battleGame).toContain("openEditSetup");
    expect(battleGame).not.toContain("setEditingSetup(true)");
    expect(nav).toContain("goForward");
    expect(nav).toContain("listFlowSkipsPostRouteSlide");
    expect(nav).toContain("startForwardSlide");

    expect(nav).toContain("LIST_FLOW_HEADER_OFFSET_CLASS");
    expect(nav).not.toContain(
      "overflow-x-hidden ${listFlowHeaderOffsetClass",
    );
    expect(nav).not.toContain("headerMode");
    expect(nav).not.toContain("setShowDetail(false);");
    expect(nav).toContain("listFlowShowsFactionBackdrop");
    expect(nav).toContain("listFlowFactionBackdropFaded");
    expect(nav).toContain("listFlowIndexBackdropRevealed");
    expect(nav).toContain("listFlowPendingRouteSplash");
    expect(nav).not.toContain("optimisticBackdrop");
    expect(nav).not.toContain("LIST_BACKDROP_RETURN_MS");
    expect(nav).not.toContain("setBackdropExiting");
    expect(nav).toContain("clearListOpenSplash");
    expect(nav).toContain('direction === "instant"');
    expect(nav).toContain("SITE_HEADER_BAR_CLASS");
    expect(nav).toContain("libraryLayer");
    expect(nav).not.toContain("libraryReturnCover");
    expect(nav).not.toContain("ios-push-overlay");
  });

  it("lets the list slide in with a loader only until it mounts", () => {
    const builder = readSource("components/BuilderScreen.tsx");
    const nav = readSource("components/IosNavSlide.tsx");
    expect(builder).toContain("listOpenNeedsSplash");
    expect(builder).toContain("clearListCreateSplash");
    expect(builder).not.toContain("LIST_OPEN_SPLASH_MS");
    expect(builder).not.toContain("setOpeningSplash(true)");
    expect(builder).not.toContain("splashExiting");
    expect(nav).not.toContain("optimisticBackdrop");
    expect(nav).not.toContain("FactionArtLayers");
    expect(nav).toContain("listFlowPendingRouteSplash");
    expect(nav).toContain("listFlowShowsFactionBackdrop");
    expect(nav).toContain("listFlowFactionBackdropFaded");
    expect(nav).toContain("cachedBackdrop");
    expect(nav).not.toContain("LIST_BACKDROP_RETURN_MS");
    expect(nav).not.toContain("factionBackdropRevealed");
    expect(nav).toContain("revealed={listFlowIndexBackdropRevealed()}");
    expect(nav).not.toMatch(/list-flow-pane[\s\S]*\{backdrop\}/);
    expect(nav).toContain("listFlowWindowScrollY");
    expect(nav).toContain("scrollToPane");
    expect(nav).not.toContain("lockPageScroll");
    expect(nav).toMatch(
      /settled: false[\s\S]*requestAnimationFrame[\s\S]*scrollToPane\(true/,
    );
    expect(nav).toContain("router.push(backHref, { scroll: false })");
    expect(nav).not.toContain(
      'router.push("/dashboard", { scroll: false });\n      animatingBackRef.current = false;',
    );
  });

  it("resolves header fallback from storage before chrome loads", () => {
    const header = readSource("components/ListFlowHeader.tsx");
    expect(header).toContain("resolveBuilderHeaderDisplay");
    expect(header).not.toContain('mode === "battle"');
    expect(header).not.toContain('label="Battle record"');
    expect(header).not.toContain("builderHeaderShowsListStats");
  });

  it("defines the list-flow carousel track in global styles", () => {
    const css = readSource("app/globals.css");
    expect(css).toContain(".list-flow-track");
    expect(css).toContain(".list-flow-track--detail");
    expect(css).toContain(".list-flow-track--settled");
    expect(css).toMatch(/translate3d\(-50%/);
    expect(css).toContain(
      ".list-flow-track--settled.list-flow-track--detail > .list-flow-pane:first-child",
    );
    expect(css).toContain(
      ".builder-view-track--play > .builder-view-pane:first-child",
    );
    expect(css).toContain("min-height: 0");
    expect(css).toContain("scrollbar-gutter: stable");
  });
});
