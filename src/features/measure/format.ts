/** Swiss number style with apostrophes, e.g. 1'234.5 */
function swiss(value: number, decimals: number): string {
  return value
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'")
}

/** Format a length in meters: "845 m" below 1 km, "12.34 km" above. */
export function formatLength(meters: number): string {
  if (meters < 1000) return `${swiss(meters, 0)} m`
  return `${swiss(meters / 1000, 2)} km`
}

/**
 * Format an area in square meters:
 * "850 m²" below 1 ha, "2.50 ha" below 1 km², "12.34 km²" above.
 */
export function formatArea(squareMeters: number): string {
  if (squareMeters < 10_000) return `${swiss(squareMeters, 0)} m²`
  if (squareMeters < 1_000_000) return `${swiss(squareMeters / 10_000, 2)} ha`
  return `${swiss(squareMeters / 1_000_000, 2)} km²`
}
