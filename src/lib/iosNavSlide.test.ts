import { describe, expect, it } from "vitest";
import {
  LIBRARY_RETURN_COVER_MS,
  iosPushSlideClass,
  libraryReturnCoverCanDismiss,
  libraryReturnCoverRemainingMs,
} from "./iosNavSlide";

describe("iosPushSlideClass", () => {
  it("maps slide phases to push transition classes", () => {
    expect(iosPushSlideClass("start")).toBe("ios-push-start");
    expect(iosPushSlideClass("in")).toBe("ios-push-in");
    expect(iosPushSlideClass("out")).toBe("ios-push-out");
    expect(iosPushSlideClass("settled")).toBe("");
  });
});

describe("library return cover", () => {
  it("holds the cover until the library route and lists are ready", () => {
    expect(
      libraryReturnCoverCanDismiss({
        isBuilder: true,
        listsReady: true,
      }),
    ).toBe(false);
    expect(
      libraryReturnCoverCanDismiss({
        isBuilder: false,
        listsReady: false,
      }),
    ).toBe(false);
    expect(
      libraryReturnCoverCanDismiss({
        isBuilder: false,
        listsReady: true,
      }),
    ).toBe(true);
  });

  it("keeps a minimum cover so the route swap never flashes through", () => {
    expect(libraryReturnCoverRemainingMs(1000, 1000)).toBe(
      LIBRARY_RETURN_COVER_MS,
    );
    expect(libraryReturnCoverRemainingMs(1000, 1000 + LIBRARY_RETURN_COVER_MS)).toBe(
      0,
    );
    expect(
      libraryReturnCoverRemainingMs(1000, 1000 + LIBRARY_RETURN_COVER_MS + 40),
    ).toBe(0);
  });
});
