// Fold a country guess to a comparable form:
// strip diacritics, lowercase, turn punctuation/whitespace runs into single
// spaces, and trim. "États–Unis" -> "etats unis".
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}
