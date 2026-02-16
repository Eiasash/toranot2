function normalize(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    // Keep letters/numbers in any language; strip punctuation.
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Strict key: includes section. Use when you want to keep patients separate per section.
 */
export function buildPatientKey(
  section: string,
  room: string | null,
  name: string | null,
) {
  return `${normalize(section)}|${normalize(room)}|${normalize(name)}`;
}

/**
 * Loose key: ignores section. Use to detect transfers (Side A -> Rehab, etc.).
 */
export function buildPatientLooseKey(room: string | null, name: string | null) {
  return `${normalize(room)}|${normalize(name)}`;
}
