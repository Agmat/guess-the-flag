// Build-time generator: derives the region icon silhouettes from real
// coastline data (Natural Earth 110m, via the public-domain world-atlas
// package) and writes src/data/region-icons.json. Run with `npm run generate`;
// the output is committed, so none of these dependencies ship to the client.
//
// Pipeline per region:
//   1. map our alpha-2 lists to the topology's numeric ids
//   2. topojson.merge() to dissolve internal borders into one silhouette
//   3. drop islands below a share of the largest landmass (sub-pixel at 28px)
//   4. project azimuthal-equal-area, rotated to the region's own centroid, so
//      no region is distorted and nothing straddles the antimeridian
//   5. fit to the 24x24 viewBox and round coordinates
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import countries from "i18n-iso-countries";
import { merge } from "topojson-client";
import { presimplify, simplify } from "topojson-simplify";
import {
  geoAzimuthalEqualArea,
  geoOrthographic,
  geoPath,
  geoCentroid,
  geoArea,
} from "d3-geo";
import { CONTINENTS, COUNTRIES_BY_CONTINENT } from "../src/data/un-members.mjs";

const require = createRequire(import.meta.url);

const SIZE = 24;
const PAD = 1.2;
// Coastline detail below this weight is dropped before projection.
const SIMPLIFY_WEIGHT = 0.4;
// Islands smaller than this share of the region's largest landmass are noise
// at 28px. Tuned so Britain and Iceland survive in Europe, New Zealand in
// Oceania, and Japan in Asia, while Fiji and the Caribbean drop out.
const MIN_ISLAND_SHARE = 0.006;

// The icon is a wayfinding symbol, not a data view. Russia spans to 180E, so
// including it stretches "Europe" across all of Siberia and the result reads
// as Asia. It stays in the Europe *quiz pool* - this only affects the glyph.
const ICON_EXCLUDE = {
  Europe: ["RU"],
};

// Natural Earth folds overseas territories into their parent country, so
// "France" carries French Guiana and "Spain" the Canaries. Those outliers
// stretch a region's bounding box and shrink the mainland to nothing - Europe
// was the worst hit. Landmasses whose centroid falls outside these
// [minLon, minLat, maxLon, maxLat] windows are dropped from the glyph.
const HOME_WINDOW = {
  Africa: [-30, -38, 56, 38],
  Americas: [-172, -57, -30, 75],
  Asia: [25, -12, 152, 56],
  Europe: [-32, 33, 45, 72],
  Oceania: [110, -48, 180, 2],
};

const topology = simplify(
  presimplify(require("world-atlas/countries-110m.json")),
  SIMPLIFY_WEIGHT,
);
const geometries = topology.objects.countries.geometries;
// Topology ids are zero-padded strings ("036"); normalise both sides.
const byNumericId = new Map(geometries.map((g) => [Number(g.id), g]));

function geometriesFor(region) {
  const excluded = new Set(ICON_EXCLUDE[region] ?? []);
  const found = [];
  const missing = [];
  for (const alpha2 of COUNTRIES_BY_CONTINENT[region]) {
    if (excluded.has(alpha2)) continue;
    const geometry = byNumericId.get(Number(countries.alpha2ToNumeric(alpha2)));
    if (geometry) found.push(geometry);
    else missing.push(alpha2);
  }
  return { found, missing };
}

/** Drop landmasses sitting outside the region's home window (see above). */
function dropOutliers(multiPolygon, region) {
  const box = HOME_WINDOW[region];
  if (!box) return { geometry: multiPolygon, dropped: 0 };
  const [minLon, minLat, maxLon, maxLat] = box;
  const kept = multiPolygon.coordinates.filter((rings) => {
    const [lon, lat] = geoCentroid({ type: "Polygon", coordinates: rings });
    return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
  });
  return {
    geometry: { type: "MultiPolygon", coordinates: kept },
    dropped: multiPolygon.coordinates.length - kept.length,
  };
}

/** Drop islands that would be sub-pixel, keeping the region's main masses. */
function dropSmallIslands(multiPolygon) {
  const polygons = multiPolygon.coordinates.map((rings) => ({
    rings,
    area: geoArea({ type: "Polygon", coordinates: rings }),
  }));
  const largest = Math.max(...polygons.map((p) => p.area));
  const kept = polygons.filter((p) => p.area >= largest * MIN_ISLAND_SHARE);
  return {
    geometry: { type: "MultiPolygon", coordinates: kept.map((p) => p.rings) },
    dropped: polygons.length - kept.length,
    kept: kept.length,
  };
}

function toPath(geometry, projection) {
  projection.fitExtent(
    [
      [PAD, PAD],
      [SIZE - PAD, SIZE - PAD],
    ],
    geometry,
  );
  const d = geoPath(projection)(geometry);
  if (!d) throw new Error("empty path");
  // Full precision is wasted at 24 units across; round to 2dp.
  return d.replace(/-?\d+\.\d+/g, (n) => String(Number(Number(n).toFixed(2))));
}

const icons = {};
const report = [];

for (const region of CONTINENTS) {
  const { found, missing } = geometriesFor(region);
  if (found.length === 0) {
    console.error(`No geometry resolved for ${region}`);
    process.exit(1);
  }
  const merged = merge(topology, found);
  const trimmed = dropOutliers(merged, region);
  const { geometry, dropped, kept } = dropSmallIslands(trimmed.geometry);
  const [lon, lat] = geoCentroid(geometry);
  // Rotating to the centroid keeps every region undistorted and clear of the
  // antimeridian, which matters for Oceania in particular.
  const projection = geoAzimuthalEqualArea().rotate([-lon, -lat]);
  icons[region] = toPath(geometry, projection);
  report.push({
    region,
    countries: `${found.length}/${COUNTRIES_BY_CONTINENT[region].length}`,
    landmasses: kept,
    droppedOutliers: trimmed.dropped,
    droppedIslands: dropped,
    chars: icons[region].length,
    missingFromData: missing.length,
  });
}

// "All" is a globe: every UN member merged, seen orthographically. The disc is
// drawn as a separate subpath so fill-rule="evenodd" knocks the land out of it.
{
  const all = CONTINENTS.flatMap((r) => geometriesFor(r).found);
  const merged = merge(topology, all);
  const { geometry, dropped, kept } = dropSmallIslands(merged);
  // Centred over Africa/Europe, the most recognisable face of the globe.
  const projection = geoOrthographic().rotate([-18, -12]);
  projection.fitExtent(
    [
      [PAD, PAD],
      [SIZE - PAD, SIZE - PAD],
    ],
    { type: "Sphere" },
  );
  const round = (n) => Number(n.toFixed(2));
  const [cx, cy] = projection([-18, -12]).map(round);
  const r = round((SIZE - PAD * 2) / 2);
  const disc =
    `M${cx} ${cy - r} A${r} ${r} 0 1 0 ${cx} ${cy + r} ` +
    `A${r} ${r} 0 1 0 ${cx} ${cy - r} Z`;
  const land = geoPath(projection)(geometry).replace(
    /-?\d+\.\d+/g,
    (n) => String(Number(Number(n).toFixed(2))),
  );
  icons.All = `${disc} ${land}`;
  report.push({
    region: "All",
    countries: `${all.length}/193`,
    landmasses: kept,
    droppedIslands: dropped,
    chars: icons.All.length,
    missingFromData: 193 - all.length,
  });
}

const outPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/data/region-icons.json",
);
writeFileSync(outPath, JSON.stringify(icons, null, 2) + "\n");
console.table(report);
console.log(
  `Wrote ${Object.keys(icons).length} region icons to ${outPath} ` +
    `(${JSON.stringify(icons).length} bytes)`,
);
