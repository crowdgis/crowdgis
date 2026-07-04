import * as L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Leaflet's default marker icon references its PNGs by a path relative to
// the CSS, which Vite's bundler does not rewrite — so every default marker
// (including Leaflet-Geoman's draw preview marker) renders as a broken
// image. Point the default icon at the bundled, hashed asset URLs. This
// fixes ALL default markers at once, drawn and preview alike.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Leaflet-Geoman's bundle expects a global `L` it can extend (L.PM = …).
// The ESM namespace object is sealed, so expose a mutable copy instead.
// Class references (L.Map, L.Class, …) stay identical, so Geoman's
// init hooks attach to the same classes react-leaflet uses.
// Import this module BEFORE '@geoman-io/leaflet-geoman-free'.
const globalWithL = globalThis as typeof globalThis & { L?: object }
globalWithL.L ??= Object.assign({}, L)

export {}
