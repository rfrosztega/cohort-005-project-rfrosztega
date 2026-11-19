import { describe, expect, it } from "vitest";
import { NOTE_PREVIEW_LENGTH, notePreview } from "../index";

describe("notePreview", () => {
  it("has nothing to preview when there is no Note", () => {
    expect(notePreview(null)).toBeNull();
    expect(notePreview(undefined)).toBeNull();
  });

  it("has nothing to preview when the Note is only whitespace", () => {
    expect(notePreview("  \n\t\n ")).toBeNull();
  });

  it("shows a short Note as it is", () => {
    expect(notePreview("Template literals compose")).toBe(
      "Template literals compose"
    );
  });

  it("shows the first line that has text", () => {
    expect(notePreview("\n   \n  First idea  \nSecond idea")).toBe(
      "First idea"
    );
  });

  it("collapses runs of whitespace inside the line", () => {
    expect(notePreview("a\t\tb   c")).toBe("a b c");
  });

  it("keeps a line that is exactly the preview length", () => {
    const line = "x".repeat(NOTE_PREVIEW_LENGTH);
    expect(notePreview(line)).toBe(line);
  });

  it("cuts a long line to the preview length, ending in an ellipsis", () => {
    const preview = notePreview("y".repeat(NOTE_PREVIEW_LENGTH + 1));
    expect(preview).toBe(`${"y".repeat(NOTE_PREVIEW_LENGTH - 1)}…`);
    expect(preview).toHaveLength(NOTE_PREVIEW_LENGTH);
  });

  it("does not leave a space before the ellipsis", () => {
    const words = `${"z".repeat(NOTE_PREVIEW_LENGTH - 2)} more words`;
    expect(notePreview(words)).toBe(`${"z".repeat(NOTE_PREVIEW_LENGTH - 2)}…`);
  });
});
