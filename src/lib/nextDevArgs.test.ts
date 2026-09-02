import { describe, expect, it } from "vitest";
import { nextDevCliArgs } from "./nextDevArgs";

describe("nextDevCliArgs", () => {
  it("keeps Turbopack when node_modules is a real folder", () => {
    expect(nextDevCliArgs({ nodeModulesIsSymlink: false })).toEqual(["dev"]);
  });

  it("uses webpack when node_modules is a worktree symlink", () => {
    expect(
      nextDevCliArgs({
        nodeModulesIsSymlink: true,
        extra: ["--port", "3000"],
      }),
    ).toEqual(["dev", "--webpack", "--port", "3000"]);
  });
});
