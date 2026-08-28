import { describe, expect, it } from "vitest";
import { iosPushSlideClass } from "./iosNavSlide";

describe("iosPushSlideClass", () => {
  it("maps slide phases to push transition classes", () => {
    expect(iosPushSlideClass("start")).toBe("ios-push-start");
    expect(iosPushSlideClass("in")).toBe("ios-push-in");
    expect(iosPushSlideClass("out")).toBe("ios-push-out");
    expect(iosPushSlideClass("settled")).toBe("");
  });
});
