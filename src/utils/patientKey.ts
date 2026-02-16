function normalize(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Strict key: section + room + name. Keeps patients separate per section. */
export function buildPatientKey(
  section: string,
  room: string | null,
  name: string | null,
): string {
  return `${normalize(section)}|${normalize(room)}|${normalize(name)}`;
}

/** Loose key: room + name only. Detects transfers between sections. */
export function buildPatientLooseKey(
  room: string | null,
  name: string | null,
): string {
  return `${normalize(room)}|${normalize(name)}`;
}
