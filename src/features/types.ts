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
   * Rendered inside the Leaflet map context (react-leaflet children).
   * Use for layers, controls and map event handlers.
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
   * Rendered as a section in the left sidebar.
   * Use for persistent panels (layer list, data import, …).
   */
  SidebarPanel?: ComponentType
  /**
   * Rendered between map and status bar, full width.
   * Use for data views (attribute table, …); render null when closed.
   */
  BottomPanel?: ComponentType
}
