import { describe, expect, it } from "vitest";
import countriesData from "../src/data/countries.json";
import { ALIASES } from "../src/lib/aliases";
import { normalize } from "../src/lib/normalize";
import type { Country } from "../src/lib/match";

const COUNTRIES = countriesData as unknown as Country[];
const codes = new Set(COUNTRIES.map((c) => c.code));

// Every country's own normalized name(s), keyed to its code - used below to
// check aliases never collide with a name that already belongs to someone.
const ownerOfName = new Map<string, string>();
for (const country of COUNTRIES) {
  ownerOfName.set(normalize(country.en), country.code);
  ownerOfName.set(normalize(country.fr), country.code);
}

describe("aliases.ts invariants", () => {
  it("every alias is already in normalize() form", () => {
    for (const [code, list] of Object.entries(ALIASES)) {
      for (const alias of list) {
        expect(normalize(alias), `${code}: "${alias}"`).toBe(alias);
      }
    }
  });

  it("every alias key is a real country code", () => {
    for (const code of Object.keys(ALIASES)) {
      expect(codes.has(code), code).toBe(true);
    }
  });

  it("no alias equals another country's own name", () => {
    for (const [code, list] of Object.entries(ALIASES)) {
      for (const alias of list) {
        const owner = ownerOfName.get(alias);
        expect(
          owner === undefined || owner === code,
          `"${alias}" is aliased to ${code} but is also ${owner}'s own name`,
        ).toBe(true);
      }
    }
  });

  it("no alias string is shared by two different country codes", () => {
    const owner = new Map<string, string>();
    for (const [code, list] of Object.entries(ALIASES)) {
      for (const alias of list) {
        const existing = owner.get(alias);
        expect(
          existing === undefined || existing === code,
          `"${alias}" is aliased to both ${existing} and ${code}`,
        ).toBe(true);
        owner.set(alias, code);
      }
    }
  });
});
