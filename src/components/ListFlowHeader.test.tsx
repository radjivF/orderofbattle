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
  it("keeps the crest, My lists, and trailing liquid-glass options and new list", async () => {
    const user = userEvent.setup();
    const openNewList = vi.fn();
    const openLibraryOptions = vi.fn();

    render(
      <ListFlowHeader
        mode="library"
        listId={null}
        builderChrome={null}
        libraryChrome={{ openNewList, openLibraryOptions }}
      />,
    );

    const brand = screen.getByRole("link", { name: "Order of Battle" });
    const heading = screen.getByRole("heading", { name: "My lists" });
    const options = screen.getByRole("button", { name: "List options" });
    const add = screen.getByRole("button", { name: "New list" });

    expect(options.className).toContain("ios-liquid-glass");
    expect(add.className).toContain("ios-liquid-glass");
    expect(heading.compareDocumentPosition(brand)).toBe(
      Node.DOCUMENT_POSITION_PRECEDING,
    );
    expect(heading.compareDocumentPosition(options)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(heading.compareDocumentPosition(add)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(options.compareDocumentPosition(add)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    await user.click(add);
    expect(openNewList).toHaveBeenCalledTimes(1);

    await user.click(options);
    expect(openLibraryOptions).toHaveBeenCalledTimes(1);
  });
});
