import { useEffect, useRef } from 'react'
import { useOlMap } from '../../map/OlMap'
import { useMapStore } from '../../state/mapStore'
import type { FeatureModule } from '../types'

/** Same center/resolution as the map's initial view (src/map/OlMap.tsx). */
const SWITZERLAND_CENTER: [number, number] = [2660000, 1190000]
const SWITZERLAND_RESOLUTION = 650

/** Resets the view to the full-Switzerland overview when requested. */
function OverviewEffect() {
  const map = useOlMap()
  const overviewToken = useMapStore((s) => s.overviewToken)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    map.getView().animate({
      center: SWITZERLAND_CENTER,
      resolution: SWITZERLAND_RESOLUTION,
      duration: 300,
    })
  }, [map, overviewToken])

  return null
}

/** Toolbar button requesting the full-Switzerland overview. */
function OverviewButton() {
  const requestOverview = useMapStore((s) => s.requestOverview)

  return (
    <button
      type="button"
      onClick={requestOverview}
      title="Ganze Schweiz anzeigen"
      aria-label="Ganze Schweiz anzeigen"
      className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-hairline bg-sheet text-base text-ink shadow-sm hover:bg-paper"
    >
      <span aria-hidden="true">⌂</span>
    </button>
  )
}

const mapOverviewFeature: FeatureModule = {
  id: 'map-overview',
  label: 'Übersicht',
  MapSlot: OverviewEffect,
  ToolbarItem: OverviewButton,
}

export default mapOverviewFeature
