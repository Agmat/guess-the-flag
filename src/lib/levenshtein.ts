// Iterative Levenshtein edit distance with a single rolling row.
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const cur = Math.min(
        prev[j] + 1, // deletion
        prev[j - 1] + 1, // insertion
        prevDiag + cost, // substitution
      );
      prevDiag = prev[j];
      prev[j] = cur;
    }
  }
  return prev[b.length];
}
