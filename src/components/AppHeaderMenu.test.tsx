import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@/test-utils/render";
import { AppHeaderMenu } from "./AppHeaderMenu";

const navigation = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  navigation.pathname = "/";
});

describe("AppHeaderMenu", () => {
  it("opens Lists and Battle record from the homepage hamburger", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<AppHeaderMenu />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const menu = screen.getByRole("dialog", { name: "Menu" });
    expect(menu).not.toHaveTextContent("Games");
    expect(screen.getByRole("heading", { name: "AOS" }));
    expect(screen.getByRole("heading", { name: "40k" }));
    expect(screen.getByRole("heading", { name: "The old world" }));
    expect(screen.getByRole("button", { name: "List builder" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Battle record" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Core rules" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Scourge of Aqshy rules" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "The old world lists" })).toBeNull();
    expect(screen.queryByRole("button", { name: "40k lists" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Spearhead record" })).toBeNull();
  });

  it("drops the drawer when the route changes so a hidden shell cannot reopen it", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { rerender } = render(<AppHeaderMenu />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();

    navigation.pathname = "/dashboard";
    rerender(<AppHeaderMenu />);

    expect(screen.queryByRole("dialog", { name: "Menu" })).toBeNull();
  });
});
