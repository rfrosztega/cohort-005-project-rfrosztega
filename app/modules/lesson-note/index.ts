import { firstLinePreview } from "./lib/preview";

/** Longest preview shown on the collapsed Note row before it is cut. */
export const NOTE_PREVIEW_LENGTH = 80;

/**
 * The one-line preview of a Note shown while the Note is collapsed on the
 * Lesson page, or `null` when the Student has nothing written yet.
 */
export function notePreview(body: string | null | undefined): string | null {
  return firstLinePreview(body ?? "", NOTE_PREVIEW_LENGTH);
}
