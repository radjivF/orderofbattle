import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@/test-utils/render";
import { ListNavProvider, useListNav } from "./IosNavSlide";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element -- test stub for next/image
    return <img alt={alt} />;
  },
}));

function OpenListButton() {
  const { goForward } = useListNav();
  return (
    <button type="button" onClick={() => goForward("/lists/abc")}>
      Open list
    </button>
  );
}

function renderFlow() {
  return render(
    <ListNavProvider libraryLayer={<OpenListButton />}>
      <p>List body</p>
    </ListNavProvider>,
  );
}

describe("ListNavProvider", () => {
  beforeEach(() => {
    navigation.pathname = "/dashboard";
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    cleanup();
  });

  it("drops the opening splash when the list route pops back to My lists", async () => {
    const user = userEvent.setup();
    const view = renderFlow();

    await user.click(screen.getByRole("button", { name: "Open list" }));
    expect(screen.getByText("Opening your list"));

    navigation.pathname = "/lists/abc";
    view.rerender(
      <ListNavProvider libraryLayer={<OpenListButton />}>
        <p>List body</p>
      </ListNavProvider>,
    );
    expect(screen.getByText("List body"));
    expect(screen.queryByText("Opening your list")).toBeNull();

    navigation.pathname = "/dashboard";
    view.rerender(
      <ListNavProvider libraryLayer={<OpenListButton />}>
        <p>List body</p>
      </ListNavProvider>,
    );

    expect(screen.queryByText("Opening your list")).toBeNull();
    expect(screen.getByRole("button", { name: "Open list" }));
    expect(screen.queryByText("List body")).toBeNull();
  });
});
