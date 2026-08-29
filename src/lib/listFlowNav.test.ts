import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  libraryCreatingSplashVisible,
  listFlowHeaderMode,
  listFlowIsHome,
  listFlowTrackClass,
  listFlowWindowScrollY,
  listOpenShowsSplash,
  listOpenDisplayNameForHeader,
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
  it("drops the create splash once the new list route is showing", () => {
    expect(libraryCreatingSplashVisible(true, "/dashboard")).toBe(true);
    expect(libraryCreatingSplashVisible(true, "/lists/abc")).toBe(false);
    expect(libraryCreatingSplashVisible(false, "/dashboard")).toBe(false);
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
    const library = readSource("components/LibraryScreen.tsx");
    expect(library).toContain("listOpenDisplayNameForHeader(list)");
    expect(library).toContain("rememberOpenList(list)");
    expect(library).not.toContain("rememberOpenList(list.factionId)");
    expect(library).not.toContain("rememberListOpen(artId, faction?.name)");
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
    expect(nav).toContain("LIST_FLOW_HEADER_OFFSET_CLASS");
    expect(nav).not.toContain(
      "overflow-x-hidden ${listFlowHeaderOffsetClass",
    );
    expect(nav).not.toContain("headerMode");
    expect(nav).not.toContain("setShowDetail(false);");
    expect(nav).toContain("{backdrop}");
    expect(nav).toContain("clearListOpenSplash");
    expect(nav).toContain("SITE_HEADER_BAR_CLASS");
    expect(nav).toContain("libraryLayer");
    expect(nav).not.toContain("libraryReturnCover");
    expect(nav).not.toContain("ios-push-overlay");
  });

  it("lets the list slide in with its opening splash on the incoming pane", () => {
    const builder = readSource("components/BuilderScreen.tsx");
    expect(builder).toContain("listOpenShowsSplash");
    expect(builder).toContain("setOpeningSplash(true)");
    expect(builder).toContain(
      'className="pointer-events-none absolute inset-0 z-30"',
    );
    expect(builder).toContain("LIST_PANE_ART_CLASS");
    expect(builder).toContain('className="relative h-full w-full"');
    expect(builder).not.toContain("fixed inset-0 z-[1]");
  });

  it("resolves header fallback from storage before chrome loads", () => {
    const header = readSource("components/ListFlowHeader.tsx");
    expect(header).toContain("resolveBuilderHeaderDisplay");
    expect(header).not.toContain("builderHeaderShowsListStats");
  });

  it("defines the list-flow carousel track in global styles", () => {
    const css = readSource("app/globals.css");
    expect(css).toContain(".list-flow-track");
    expect(css).toContain(".list-flow-track--detail");
    expect(css).toContain(".list-flow-track--settled");
    expect(css).toContain("translateX(-50%)");
    expect(css).toContain(
      ".list-flow-track--settled.list-flow-track--detail > .list-flow-pane:first-child",
    );
    expect(css).toContain(
      ".builder-view-track--play > .builder-view-pane:first-child",
    );
    expect(css).toContain("min-height: 0");
  });
});
