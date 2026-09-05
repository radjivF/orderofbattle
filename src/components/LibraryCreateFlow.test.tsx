import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@/test-utils/render";
import { LibraryCreateFlow } from "./LibraryCreateFlow";
import { setActiveMenu } from "@/lib/activeMenu";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("@/lib/storage", () => ({
  blankArmy: vi.fn((factionId: string, name: string, points: number) => ({
    id: "test-list-id",
    factionId,
    name,
    points,
  })),
  blankSpearhead: vi.fn(),
  blankTowArmy: vi.fn(),
  saveArmy: vi.fn(),
}));

vi.mock("@/lib/listTransition", () => ({
  rememberListCreate: vi.fn(),
  peekListCreateSplash: vi.fn(() => false),
  subscribeListOpenFaction: (cb: () => void) => {
    cb();
    return () => {};
  },
}));

describe("LibraryCreateFlow", () => {
  beforeEach(() => {
    cleanup();
    navigation.push.mockClear();
    navigation.replace.mockClear();
    localStorage.clear();
    setActiveMenu("aos");
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

  it("shows AoS faction picker when activeMenu is aos", () => {
    setActiveMenu("aos");
    render(
      <LibraryCreateFlow open onOpenChange={() => {}} />,
    );

    expect(screen.getByRole("heading", { name: "Choose a faction" }));
    expect(screen.getByRole("button", { name: "Stormcast Eternals" }));
  });

  it("shows AoS faction picker when activeMenu is tactics (Battle record)", () => {
    setActiveMenu("tactics");
    render(
      <LibraryCreateFlow open onOpenChange={() => {}} />,
    );

    expect(screen.getByRole("heading", { name: "Choose a faction" }));
    expect(screen.getByRole("button", { name: "Stormcast Eternals" }));
  });

  it("shows AoS faction picker when activeMenu is core-rules", () => {
    setActiveMenu("core-rules");
    render(
      <LibraryCreateFlow open onOpenChange={() => {}} />,
    );

    expect(screen.getByRole("heading", { name: "Choose a faction" }));
    expect(screen.getByRole("button", { name: "Stormcast Eternals" }));
  });

  it("shows AoS faction picker when activeMenu is scourge-rules", () => {
    setActiveMenu("scourge-rules");
    render(
      <LibraryCreateFlow open onOpenChange={() => {}} />,
    );

    expect(screen.getByRole("heading", { name: "Choose a faction" }));
    expect(screen.getByRole("button", { name: "Stormcast Eternals" }));
  });

  it("does not show any sheet when open is false", () => {
    setActiveMenu("tactics");
    render(
      <LibraryCreateFlow open={false} onOpenChange={() => {}} />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("allows faction selection and list creation when activeMenu is tactics", async () => {
    const onOpenChange = vi.fn();
    setActiveMenu("tactics");
    render(
      <LibraryCreateFlow open onOpenChange={onOpenChange} />,
    );

    expect(screen.getByRole("heading", { name: "Choose a faction" }));
    expect(screen.getByRole("button", { name: "Stormcast Eternals" }));
  });
});
