import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  closeDetailFromButton,
  closeDetailFromKey,
  closeDetailFromPointer,
} from "./calendarDetailClose.ts";

describe("calendar detail close methods", () => {
  it("closes with the close button", () => {
    let closeCount = 0;

    closeDetailFromButton(() => {
      closeCount += 1;
    });

    assert.equal(closeCount, 1);
  });

  it("closes when the user points outside the detail panel", () => {
    let closeCount = 0;
    const didClose = closeDetailFromPointer(
      () => {
        closeCount += 1;
      },
      { clickedDateCell: false, clickedInsidePanel: false },
    );

    assert.equal(didClose, true);
    assert.equal(closeCount, 1);
  });

  it("keeps the detail panel open for clicks inside it or on a date cell", () => {
    let closeCount = 0;
    const close = () => {
      closeCount += 1;
    };

    assert.equal(
      closeDetailFromPointer(close, { clickedDateCell: false, clickedInsidePanel: true }),
      false,
    );
    assert.equal(
      closeDetailFromPointer(close, { clickedDateCell: true, clickedInsidePanel: false }),
      false,
    );
    assert.equal(closeCount, 0);
  });

  it("closes with Escape but ignores other keys", () => {
    let closeCount = 0;
    const close = () => {
      closeCount += 1;
    };

    assert.equal(closeDetailFromKey(close, "Enter"), false);
    assert.equal(closeDetailFromKey(close, "Escape"), true);
    assert.equal(closeCount, 1);
  });
});
