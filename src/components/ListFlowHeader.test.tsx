import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test-utils/render";
import { ListFlowHeader } from "./ListFlowHeader";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element -- test stub for next/image
    return <img alt={alt} />;
  },
}));

describe("ListFlowHeader", () => {
  it("keeps brand in the library header with a light options control", async () => {
    const user = userEvent.setup();
    const openLibraryOptions = vi.fn();

    render(
      <ListFlowHeader
        mode="library"
        listId={null}
        builderChrome={null}
        libraryChrome={{ openLibraryOptions }}
      />,
    );

    expect(
      screen.getByRole("link", { name: /Order of Battle/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "My lists" })).toBeNull();
    expect(screen.queryByRole("button", { name: "New list" })).toBeNull();

    const options = screen.getByRole("button", { name: "List options" });
    expect(options.className).not.toContain("ios-liquid-glass");

    await user.click(options);
    expect(openLibraryOptions).toHaveBeenCalledTimes(1);
  });
});
