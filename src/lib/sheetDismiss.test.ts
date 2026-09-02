import { describe, expect, it } from "vitest";
import {
  shouldBeginSheetDrag,
  shouldCommitSheetDismiss,
  sheetDismissEligible,
} from "./sheetDismiss";

describe("sheetDismissEligible", () => {
  it("allows dismiss from grabber even when scrolled", () => {
    expect(
      sheetDismissEligible({
        fromGrabber: true,
        inScrollArea: true,
        scrollTop: 120,
      }),
    ).toBe(true);
  });

  it("does not steal drags from buttons and other controls", () => {
    expect(
      sheetDismissEligible({
        fromGrabber: false,
        fromControl: true,
        inScrollArea: true,
        scrollTop: 0,
      }),
    ).toBe(false);
  });

  it("allows dismiss from header chrome outside the scroll body", () => {
    expect(
      sheetDismissEligible({
        fromGrabber: false,
        inScrollArea: false,
        scrollTop: 0,
      }),
    ).toBe(true);
  });

  it("only allows scroll-area dismiss at scroll top", () => {
    expect(
      sheetDismissEligible({
        fromGrabber: false,
        inScrollArea: true,
        scrollTop: 0,
      }),
    ).toBe(true);
    expect(
      sheetDismissEligible({
        fromGrabber: false,
        inScrollArea: true,
        scrollTop: 8,
      }),
    ).toBe(false);
  });
});

describe("shouldBeginSheetDrag", () => {
  it("starts once the user pulls down past the threshold at scroll top", () => {
    expect(
      shouldBeginSheetDrag({
        dismissEligible: true,
        scrollTop: 0,
        dy: 6,
      }),
    ).toBe(true);
    expect(
      shouldBeginSheetDrag({
        dismissEligible: true,
        scrollTop: 0,
        dy: 2,
      }),
    ).toBe(false);
  });

  it("ignores upward pulls and mid-list scroll positions", () => {
    expect(
      shouldBeginSheetDrag({
        dismissEligible: true,
        scrollTop: 0,
        dy: -4,
      }),
    ).toBe(false);
    expect(
      shouldBeginSheetDrag({
        dismissEligible: true,
        scrollTop: 40,
        dy: 20,
      }),
    ).toBe(false);
  });
});

describe("shouldCommitSheetDismiss", () => {
  it("commits when dragged far enough", () => {
    expect(shouldCommitSheetDismiss(80, 320)).toBe(true);
    expect(shouldCommitSheetDismiss(40, 320)).toBe(false);
  });
});
