import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@/test-utils/render";
import { SiteFooter } from "./SiteFooter";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SiteFooter", () => {
  beforeEach(() => {
    cleanup();
  });

  it("shows the free-app pitch by default", () => {
    render(<SiteFooter />);
    expect(
      screen.getByRole("heading", { name: "This app is free. It stays free." }),
    );
  });

  it("can hide the pitch and keep legal links", () => {
    render(<SiteFooter showPitch={false} />);
    expect(
      screen.queryByRole("heading", { name: "This app is free. It stays free." }),
    ).toBeNull();
    expect(screen.getByRole("link", { name: "Privacy" }));
  });
});
