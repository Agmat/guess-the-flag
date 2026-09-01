// Hand-drawn stylised continent silhouettes, authored against a 24x24 viewBox
// and tuned by eye at their real 28px render size. They are deliberately
// approximations, not cartography: at this size a faithful coastline collapses
// into noise, so each shape keeps only the few features that identify it
// (Africa's Horn, the Americas' isthmus, Scandinavia and Italy, India's spike).
//
// "All" is a globe rather than a world map: a five-landmass map was tested at
// 28px and read as an indistinct scatter of marks.
export const REGION_PATHS: Record<string, string> = {
  // Filled circle with the landmasses knocked out via fill-rule="evenodd".
  All:
    "M12 2.6 A9.4 9.4 0 1 0 12 21.4 A9.4 9.4 0 1 0 12 2.6 Z " +
    "M6.2 6.4 L9 6 L9.6 8.4 L7.4 9.6 L8.2 12 L6.6 14.6 L5.4 11.6 L5.8 9 Z " +
    "M12.4 5.2 L16.6 5.6 L18.6 7 L16.4 8.8 L14 8 L12.6 9.4 L13 12.2 " +
    "L11.6 14.8 L10.8 11 L11.2 7.6 Z " +
    "M15.6 15.4 L18.4 16 L17.8 18 L15.2 17.2 Z",

  // Wide Mediterranean coast, West African bulge, Horn spike, tapering south.
  Africa:
    "M4.8 3.8 L17.4 3.6 L18.8 7.6 L22 9.4 L18.4 10.6 L16.2 14.4 L13.2 21.4 " +
    "L11.6 21.9 L10.4 17.6 L8.8 13.4 L6.2 11.6 L3.6 8.2 L3.4 5.4 Z",

  // Blocky North America, a thin isthmus, then a tapering South America.
  Americas:
    "M3.2 3.4 L11 2.6 L18.5 3.6 L19.4 6.6 L16 8.4 L13.4 9.2 L14.8 11.4 " +
    "L16.8 14 L16 18.6 L13.4 22 L12 19 L11.6 14.4 L10 11.2 L7 8.6 L3.6 6.4 Z",

  // Broad north, Arabia lower-left, India as a clear spike, SE Asia trailing.
  Asia:
    "M2.8 8 L5.5 4 L12 2.6 L19.5 3.4 L22 6.6 L21 9.6 L22 12.4 L18.6 12.8 " +
    "L18.4 16.4 L20 18.6 L16.6 17.6 L15.4 13.6 L13.6 13.2 L12.2 20 " +
    "L10.6 13.4 L7 12.4 L5 13.2 L3.6 10.4 Z",

  // Scandinavian hook at the top, Iberia lower-left, Italy as the long spike.
  Europe:
    "M5.8 10.6 L7.4 6 L9.8 2.8 L11.4 3.4 L10.6 7.2 L12.6 6 L14.2 4 L18.6 4.4 " +
    "L21.2 7.6 L20 11.4 L21 14.2 L17 14.6 L15.6 17.8 L14.6 14.4 L12.2 14.6 " +
    "L11.3 19.8 L10.1 14.8 L7.6 14 Z",

  // Australia with the Carpentaria notch and Cape York, plus New Zealand.
  Oceania:
    "M4.6 9.6 L7.8 6.6 L9.4 9.2 L11 6 L12.8 9 L16.8 7.4 L19 10.4 L17.8 14.2 " +
    "L13.6 16.6 L8.8 16 L5.2 13.2 Z " +
    "M19.2 16.6 L21.8 17.6 L21 20 L18.7 18.7 Z",
};

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
      {/* currentColor lets the card set the hue with a single `color` rule. */}
      <path d={path} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
