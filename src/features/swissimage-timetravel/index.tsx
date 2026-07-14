import { useEffect, useRef } from 'react'
import type TileLayer from 'ol/layer/Tile'
import { useOlMap } from '../../map/OlMap'
import type { FeatureModule } from '../types'
import { fetchSwissimageTimes } from './capabilities'
import { makeSwissimageLayer } from './layer'
import { useSwissimageTimetravelStore } from './store'

/** Displays the year value of a Value string, e.g. '20230101' -> '2023'. */
function timeLabel(time: string): string {
  return time === 'current' ? 'Aktuell' : time.slice(0, 4)
}

/** Mounts the SwissImage time-travel layer while it is switched on. */
function SwissimageTimetravelLayer() {
  const map = useOlMap()
  const visible = useSwissimageTimetravelStore((s) => s.visible)
  const opacity = useSwissimageTimetravelStore((s) => s.opacity)
  const time = useSwissimageTimetravelStore((s) => s.time)
  const setAvailableTimes = useSwissimageTimetravelStore(
    (s) => s.setAvailableTimes,
  )
  const layerRef = useRef<TileLayer | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchSwissimageTimes().then((times) => {
      if (!cancelled) setAvailableTimes(times)
    })
    return () => {
      cancelled = true
    }
  }, [setAvailableTimes])

  useEffect(() => {
    if (!visible) return
    const layer = makeSwissimageLayer(time)
    // Above the basemap (0), below imported/sketched layers (>=1).
    layer.setZIndex(0.5)
    layer.setOpacity(opacity)
    layerRef.current = layer
    map.addLayer(layer)
    return () => {
      map.removeLayer(layer)
      layerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, visible, time])

  useEffect(() => {
    layerRef.current?.setOpacity(opacity)
  }, [opacity])

  return null
}

/** Sidebar controls: on/off, opacity and the historical year. */
function SwissimageTimetravelPanel() {
  const visible = useSwissimageTimetravelStore((s) => s.visible)
  const opacity = useSwissimageTimetravelStore((s) => s.opacity)
  const time = useSwissimageTimetravelStore((s) => s.time)
  const availableTimes = useSwissimageTimetravelStore((s) => s.availableTimes)
  const setVisible = useSwissimageTimetravelStore((s) => s.setVisible)
  const setOpacity = useSwissimageTimetravelStore((s) => s.setOpacity)
  const setTime = useSwissimageTimetravelStore((s) => s.setTime)

  return (
    <section className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm text-black">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
          className="accent-ink"
          aria-label="SwissImage-Zeitreise ein-/ausblenden"
        />
        SwissImage-Luftbild einblenden
      </label>

      <label className="flex flex-col gap-1">
        <span className="label-micro">Aufnahmejahr</span>
        <select
          className="rounded-[3px] border border-hairline bg-sheet px-2 py-1 text-sm text-black disabled:opacity-50"
          value={time}
          disabled={!visible}
          onChange={(e) => setTime(e.target.value)}
          aria-label="Aufnahmejahr wählen"
        >
          {availableTimes.map((t) => (
            <option key={t} value={t}>
              {timeLabel(t)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="label-micro">Transparenz</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={opacity}
          disabled={!visible}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="disabled:opacity-50"
          aria-label="Transparenz der Luftbild-Ebene"
        />
      </label>
    </section>
  )
}

const swissimageTimetravelFeature: FeatureModule = {
  id: 'swissimage-timetravel',
  label: 'SwissImage-Zeitreise',
  icon: '📷',
  MapSlot: SwissimageTimetravelLayer,
  SidebarPanel: SwissimageTimetravelPanel,
}

export default swissimageTimetravelFeature
