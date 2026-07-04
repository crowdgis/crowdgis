import type { ComponentType } from 'react'

/**
 * A self-contained feature module of the CrowdGIS application.
 *
 * Every feature lives in its own folder `src/features/<id>/` and exposes
 * exactly one `FeatureModule` as default export from its `index.ts(x)`.
 * Features are wired into the UI exclusively through the slots below —
 * they must never patch other features or core files.
 */
export interface FeatureModule {
  /** Unique kebab-case id. Must match the folder name under src/features/. */
  id: string
  /** Human-readable German label, shown in the UI. */
  label: string
  /**
   * Optional single character or emoji for the compact sidebar icon
   * rail. When omitted, the first letter of `label` is shown as a
   * monogram — setting this is never required.
   */
  icon?: string
  /**
   * Rendered inside the map container. Access the OpenLayers map with
   * `useOlMap()` from `src/map/OlMap`; the view runs in EPSG:2056 while
   * store data stays WGS84 GeoJSON (helpers: `src/lib/ol-geojson.ts`).
   * Absolutely positioned children overlay the map (tool UIs).
   */
  MapSlot?: ComponentType
  /**
   * Rendered in the floating toolbar overlay (top-right of the map).
   * Use for buttons, switchers and small tool UIs.
   */
  ToolbarItem?: ComponentType
  /**
   * Rendered in the status bar at the bottom of the app.
   * Use for compact live information (e.g. coordinates).
   */
  StatusBarItem?: ComponentType
  /**
   * Rendered as a collapsible section in the left sidebar. The core
   * draws the frame: a header with `label` and open/close handling.
   * Render CONTENT ONLY — no own heading, no own collapse logic.
   */
  SidebarPanel?: ComponentType
  /**
   * Rendered between map and status bar, full width.
   * Use for data views (attribute table, …); render null when closed.
   */
  BottomPanel?: ComponentType
  /**
   * Rendered on the right side of the app header.
   * Use for compact actions (buttons, toggles).
   */
  HeaderItem?: ComponentType
  /**
   * Rendered above the map area (position yourself absolutely inside
   * the map container). Use for drawers and dialogs; render null when closed.
   */
  Overlay?: ComponentType
}
