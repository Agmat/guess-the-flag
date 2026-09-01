import regionIcons from "../data/region-icons.json";

// Continent silhouettes derived from real coastline data (Natural Earth 110m,
// public domain) by scripts/generate-region-icons.mjs. Regenerate with
// `npm run generate` after changing the continent lists in un-members.mjs.
//
// The generator's own comments explain the two adjustments that matter:
// Russia is left out of the Europe *glyph* (it stays in the quiz pool), and
// overseas territories are trimmed so a region's bounding box reflects its
// mainland. "All" is a globe rather than a flat world map, because a
// five-landmass map was tested at 28px and read as an indistinct scatter.
export const REGION_PATHS = regionIcons as Record<string, string>;

interface RegionIconProps {
  region: string;
  size?: number;
}

export function RegionIcon({ region, size = 28 }: RegionIconProps) {
  const path = REGION_PATHS[region] ?? REGION_PATHS.All;
  return (
    <svg
      className="region__icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {/* currentColor lets the card set the hue with a single `color` rule.
          evenodd knocks the landmasses out of the globe's disc for "All". */}
      <path d={path} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
