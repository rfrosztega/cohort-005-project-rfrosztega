const ELLIPSIS = "…";

export function firstLinePreview(
  text: string,
  maxLength: number
): string | null {
  const firstLine = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .find((line) => line.length > 0);
  if (!firstLine) return null;
  if (firstLine.length <= maxLength) return firstLine;
  return `${firstLine.slice(0, maxLength - ELLIPSIS.length).trimEnd()}${ELLIPSIS}`;
}
