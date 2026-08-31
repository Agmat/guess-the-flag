import { describe, expect, it } from "vitest";
import countriesData from "../src/data/countries.json";
import { CONTINENTS } from "../src/data/un-members.mjs";
import type { Country } from "../src/lib/match";

const COUNTRIES = countriesData as unknown as Country[];

describe("countries.json", () => {
  it("has all 193 UN member states", () => {
    expect(COUNTRIES).toHaveLength(193);
    expect(new Set(COUNTRIES.map((c) => c.code)).size).toBe(193);
  });

  it("tags every country with a known continent", () => {
    for (const country of COUNTRIES) {
      expect(CONTINENTS).toContain(country.continent);
    }
  });

  it("continent counts sum to 193", () => {
    const total = CONTINENTS.reduce(
      (sum: number, continent: string) =>
        sum + COUNTRIES.filter((c) => c.continent === continent).length,
      0,
    );
    expect(total).toBe(193);
  });
});
