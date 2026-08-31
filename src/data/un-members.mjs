// The 193 UN member states, grouped by the continent used for the quiz filter.
// Transcontinental countries follow common quiz convention:
//   Russia, Cyprus -> Europe;  Turkey, Kazakhstan, Georgia, Armenia,
//   Azerbaijan -> Asia;  Egypt -> Africa.
// Used only by scripts/generate-countries.mjs at build time.
export const CONTINENTS = ["Africa", "Americas", "Asia", "Europe", "Oceania"];

export const COUNTRIES_BY_CONTINENT = {
  Africa: [
    "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD",
    "KM", "CG", "CD", "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET",
    "GA", "GM", "GH", "GN", "GW", "KE", "LS", "LR", "LY", "MG",
    "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG", "RW",
    "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG",
    "TN", "UG", "ZM", "ZW",
  ],
  Americas: [
    "AG", "AR", "BS", "BB", "BZ", "BO", "BR", "CA", "CL", "CO",
    "CR", "CU", "DM", "DO", "EC", "SV", "GD", "GT", "GY", "HT",
    "HN", "JM", "MX", "NI", "PA", "PY", "PE", "KN", "LC", "VC",
    "SR", "TT", "US", "UY", "VE",
  ],
  Asia: [
    "AF", "AM", "AZ", "BH", "BD", "BT", "BN", "KH", "CN", "GE",
    "IN", "ID", "IR", "IQ", "IL", "JP", "JO", "KZ", "KW", "KG",
    "LA", "LB", "MY", "MV", "MN", "MM", "NP", "KP", "OM", "PK",
    "PH", "QA", "SA", "SG", "KR", "LK", "SY", "TJ", "TH", "TL",
    "TR", "TM", "AE", "UZ", "VN", "YE",
  ],
  Europe: [
    "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CY", "CZ",
    "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IE", "IT",
    "LV", "LI", "LT", "LU", "MT", "MD", "MC", "ME", "NL", "MK",
    "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES",
    "SE", "CH", "UA", "GB",
  ],
  Oceania: [
    "AU", "FJ", "KI", "MH", "FM", "NR", "NZ", "PW", "PG", "WS",
    "SB", "TO", "TV", "VU",
  ],
};

// Flat list, derived from the groups.
export const UN_MEMBERS = CONTINENTS.flatMap(
  (continent) => COUNTRIES_BY_CONTINENT[continent],
);
