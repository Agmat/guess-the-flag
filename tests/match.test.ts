import { describe, expect, it } from "vitest";
import { isCorrectAnswer, type Country } from "../src/lib/match";

const COUNTRIES: Country[] = [
  { code: "FR", en: "France", fr: "France", continent: "Europe" },
  { code: "US", en: "United States of America", fr: "États-Unis d'Amérique", continent: "Americas" },
  { code: "GB", en: "United Kingdom", fr: "Royaume-Uni", continent: "Europe" },
  { code: "IR", en: "Iran", fr: "Iran", continent: "Asia" },
  { code: "IQ", en: "Iraq", fr: "Irak", continent: "Asia" },
  { code: "TD", en: "Chad", fr: "Tchad", continent: "Africa" },
  { code: "DE", en: "Germany", fr: "Allemagne", continent: "Europe" },
];

const byCode = (code: string): Country => {
  const c = COUNTRIES.find((x) => x.code === code);
  if (!c) throw new Error(`no fixture for ${code}`);
  return c;
};

const check = (guess: string, code: string) =>
  isCorrectAnswer(guess, byCode(code), COUNTRIES);

describe("isCorrectAnswer", () => {
  it("is case- and accent-insensitive", () => {
    expect(check("etats unis", "US")).toBe(true);
    expect(check("ÉTATS-UNIS", "US")).toBe(true);
    expect(check("france", "FR")).toBe(true);
  });

  it("accepts curated aliases", () => {
    expect(check("uk", "GB")).toBe(true);
    expect(check("usa", "US")).toBe(true);
  });

  it("tolerates a single typo on long names", () => {
    expect(check("frannce", "FR")).toBe(true);
    expect(check("germny", "DE")).toBe(true);
  });

  it("does not accept an exact name for a different country (Iran vs Iraq)", () => {
    expect(check("iran", "IQ")).toBe(false);
    expect(check("iran", "IR")).toBe(true);
  });

  it("does not fuzzy-match short country names", () => {
    expect(check("chd", "TD")).toBe(false);
    expect(check("chad", "TD")).toBe(true);
  });

  it("rejects a plain wrong answer", () => {
    expect(check("spain", "FR")).toBe(false);
    expect(check("", "FR")).toBe(false);
  });
});
