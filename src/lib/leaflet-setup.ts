import * as L from 'leaflet'

// Leaflet-Geoman's bundle expects a global `L` it can extend (L.PM = …).
// The ESM namespace object is sealed, so expose a mutable copy instead.
// Class references (L.Map, L.Class, …) stay identical, so Geoman's
// init hooks attach to the same classes react-leaflet uses.
// Import this module BEFORE '@geoman-io/leaflet-geoman-free'.
const globalWithL = globalThis as typeof globalThis & { L?: object }
globalWithL.L ??= Object.assign({}, L)

export {}
