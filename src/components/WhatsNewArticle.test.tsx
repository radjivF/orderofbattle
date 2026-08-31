import { beforeEach, describe, expect, it, vi } from "vitest";
import { WHATS_NEW_ITEMS } from "@/lib/whatsNew";
import { cleanup, render, screen } from "@/test-utils/render";
import { WhatsNewArticle } from "./WhatsNewArticle";

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

describe("WhatsNewArticle", () => {
  beforeEach(() => {
    cleanup();
  });

  it("lists this release's bug fixes", () => {
    render(<WhatsNewArticle />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "What's new in Order of Battle",
      }),
    );
    for (const line of WHATS_NEW_ITEMS) {
      expect(screen.getByText(line));
    }
  });

  it("explains when no updates have been published yet", () => {
    render(<WhatsNewArticle items={[]} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "What's new in Order of Battle",
      }),
    );
    expect(screen.getByText("No updates have been published yet."));
  });
});
