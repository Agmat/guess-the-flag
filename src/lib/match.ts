import { normalize } from "./normalize";
import { levenshtein } from "./levenshtein";
import { ALIASES } from "./aliases";

export interface Country {
  code: string;
  en: string;
  fr: string;
  continent: string;
}

// Minimum candidate length before typo tolerance is allowed. Short country
// names (Chad, Cuba, Mali, Iran) are one edit apart from each other, so
// fuzzy matching on them accepts wrong answers.
const MIN_FUZZY_LENGTH = 5;

function candidatesFor(country: Country): string[] {
  return [
    normalize(country.en),
    normalize(country.fr),
    ...(ALIASES[country.code] ?? []),
  ];
}

export function isCorrectAnswer(
  guess: string,
  country: Country,
  allCountries: readonly Country[],
): boolean {
  const normalizedGuess = normalize(guess);
  if (normalizedGuess === "") return false;

  const candidates = candidatesFor(country);
  if (candidates.includes(normalizedGuess)) return true;

  // Never accept a guess that is an exact name for a different country
  // (e.g. "iran" typed on Iraq's flag - fr "Irak" is one edit from "Iran").
  const namesAnotherCountry = allCountries.some(
    (other) =>
      other.code !== country.code &&
      candidatesFor(other).includes(normalizedGuess),
  );
  if (namesAnotherCountry) return false;

  return candidates.some(
    (candidate) =>
      candidate.length >= MIN_FUZZY_LENGTH &&
      levenshtein(normalizedGuess, candidate) <= 1,
  );
}
