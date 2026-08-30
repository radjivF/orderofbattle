import { describe, expect, it } from "vitest";
import { organizationNode, pageGraph, softwareApplicationNode } from "./jsonLd";

describe("jsonLd", () => {
  it("builds organization node with site name", () => {
    const node = organizationNode();
    expect(node["@type"]).toBe("Organization");
    expect(node.name).toBe("Order of Battle");
    expect(node.url).toContain("http");
  });

  it("builds software application node", () => {
    const node = softwareApplicationNode();
    expect(node["@type"]).toBe("WebApplication");
    expect(node.isAccessibleForFree).toBe(true);
  });

  it("assembles page graph nodes", () => {
    const graph = pageGraph([
      organizationNode(),
      softwareApplicationNode(),
    ]);
    expect(graph["@graph"]).toHaveLength(2);
  });
});
