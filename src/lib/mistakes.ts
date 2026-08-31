// Persistent "mistakes" list: country codes the player has missed, kept in
// localStorage across sessions and practised via the Review mode. A code is
// added on any wrong answer and removed only when answered correctly during
// a Review run.
const STORAGE_KEY = "guess-the-flag:mistakes";

export function parseMistakeList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((code): code is string => typeof code === "string");
  } catch {
    return [];
  }
}

export function withMistake(list: readonly string[], code: string): string[] {
  return list.includes(code) ? [...list] : [...list, code];
}

export function withoutMistake(list: readonly string[], code: string): string[] {
  return list.filter((existing) => existing !== code);
}

export function readMistakes(): string[] {
  try {
    return parseMistakeList(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeMistakes(list: readonly string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable (private mode, disabled cookies) - ignore
  }
}
