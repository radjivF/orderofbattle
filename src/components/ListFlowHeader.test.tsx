import { describe, expect, it, vi } from "vitest";
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
  it("keeps brand in the library header without list actions", () => {
    render(
      <ListFlowHeader
        mode="library"
        listId={null}
        builderChrome={null}
        libraryChrome={null}
      />,
    );

    expect(screen.getByRole("link", { name: /Order of Battle/i }));
    expect(screen.queryByRole("heading", { name: "My lists" })).toBeNull();
    expect(screen.queryByRole("button", { name: "New list" })).toBeNull();
    expect(screen.queryByRole("button", { name: "List options" })).toBeNull();
  });
});
