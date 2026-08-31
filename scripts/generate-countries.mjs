// Build-time generator: resolves UN member codes to English + French common
// names via i18n-iso-countries, tags each with its quiz continent, and writes
// src/data/countries.json. Run manually with `npm run generate`; output committed.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json" with { type: "json" };
import fr from "i18n-iso-countries/langs/fr.json" with { type: "json" };
import {
  CONTINENTS,
  COUNTRIES_BY_CONTINENT,
  UN_MEMBERS,
} from "../src/data/un-members.mjs";

countries.registerLocale(en);
countries.registerLocale(fr);

// A few i18n-iso-countries defaults are too formal for a quiz reveal.
// Long forms stay accepted as answers via src/lib/aliases.ts.
const NAME_OVERRIDES = {
  CN: { en: "China" },
  GM: { en: "Gambia" },
  IR: { en: "Iran" },
  LA: { en: "Laos" },
  FM: { en: "Micronesia" },
  MD: { en: "Moldova" },
  MK: { en: "North Macedonia" },
  RU: { en: "Russia" },
  SY: { en: "Syria" },
  TZ: { en: "Tanzania", fr: "Tanzanie" },
};

const continentOf = {};
for (const continent of CONTINENTS) {
  for (const code of COUNTRIES_BY_CONTINENT[continent]) continentOf[code] = continent;
}

const seen = new Set();
const duplicates = [];
for (const code of UN_MEMBERS) {
  if (seen.has(code)) duplicates.push(code);
  seen.add(code);
}
if (duplicates.length > 0) {
  console.error(`Duplicate country codes: ${duplicates.join(", ")}`);
  process.exit(1);
}

const rows = [];
const unresolved = [];
for (const code of UN_MEMBERS) {
  const enName = countries.getName(code, "en");
  const frName = countries.getName(code, "fr");
  const continent = continentOf[code];
  if (!enName || !frName || !continent) {
    unresolved.push(code);
    continue;
  }
  const override = NAME_OVERRIDES[code] ?? {};
  rows.push({
    code,
    en: override.en ?? enName,
    fr: override.fr ?? frName,
    continent,
  });
}

if (unresolved.length > 0) {
  console.error(`Unresolved country codes: ${unresolved.join(", ")}`);
  process.exit(1);
}
if (rows.length !== 193) {
  console.error(`Expected 193 countries, got ${rows.length}`);
  process.exit(1);
}

rows.sort((a, b) => a.en.localeCompare(b.en, "en"));

const outPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/data/countries.json",
);
writeFileSync(outPath, JSON.stringify(rows, null, 2) + "\n");

const byContinent = Object.fromEntries(CONTINENTS.map((c) => [c, 0]));
for (const row of rows) byContinent[row.continent]++;
console.log(`Wrote ${rows.length} countries to ${outPath}`);
console.log(byContinent);
