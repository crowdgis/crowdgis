import { useEffect, useRef, useState } from 'react'
import type TileLayer from 'ol/layer/Tile'
import { useOlMap } from '../../map/OlMap'
import type { FeatureModule } from '../types'
import {
  DEFAULT_HISTORICAL_MAPS_FORMAT,
  fetchHistoricalMapsCapabilities,
} from './capabilities'
import { clipLayerToSwipe, makeHistoricalMapLayer } from './layer'
import { useHistoricalMapsStore } from './store'

/** Displays the year value of a Value string, e.g. '20230101' -> '2023'. */
function timeLabel(time: string): string {
  return time === 'current' ? 'Aktuell' : time.slice(0, 4)
}

/** Draggable vertical handle that moves the swipe position on the map. */
function SwipeHandle() {
  const map = useOlMap()
  const swipePosition = useHistoricalMapsStore((s) => s.swipePosition)
  const setSwipePosition = useHistoricalMapsStore((s) => s.setSwipePosition)
  const draggingRef = useRef(false)

  useEffect(() => {
    function updateFromClientX(clientX: number) {
      const rect = map.getTargetElement()?.getBoundingClientRect()
      if (!rect || rect.width === 0) return
      setSwipePosition(((clientX - rect.left) / rect.width) * 100)
    }
    function handleMove(e: PointerEvent) {
      if (draggingRef.current) updateFromClientX(e.clientX)
    }
    function handleUp() {
      draggingRef.current = false
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [map, setSwipePosition])

  return (
    <div
      className="absolute top-0 bottom-0 z-10 w-[3px] cursor-ew-resize bg-white shadow-md"
      style={{ left: `${swipePosition}%` }}
      onPointerDown={() => {
        draggingRef.current = true
      }}
      role="slider"
      aria-label="Swipe-Regler für Kartenvergleich"
      aria-valuenow={Math.round(swipePosition)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setSwipePosition(swipePosition - 2)
        if (e.key === 'ArrowRight') setSwipePosition(swipePosition + 2)
      }}
    >
      <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs shadow-md">
        ↔
      </div>
    </div>
  )
}

/** Mounts the historical map time-travel layer(s) while switched on. */
function HistoricalMapsLayer() {
  const map = useOlMap()
  const visible = useHistoricalMapsStore((s) => s.visible)
  const opacity = useHistoricalMapsStore((s) => s.opacity)
  const time = useHistoricalMapsStore((s) => s.time)
  const compareEnabled = useHistoricalMapsStore((s) => s.compareEnabled)
  const compareTime = useHistoricalMapsStore((s) => s.compareTime)
  const swipePosition = useHistoricalMapsStore((s) => s.swipePosition)
  const setAvailableTimes = useHistoricalMapsStore((s) => s.setAvailableTimes)
  const [format, setFormat] = useState(DEFAULT_HISTORICAL_MAPS_FORMAT)
  const layerRef = useRef<TileLayer | null>(null)
  const compareLayerRef = useRef<TileLayer | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchHistoricalMapsCapabilities().then(({ times, format }) => {
      if (cancelled) return
      setAvailableTimes(times)
      setFormat(format)
    })
    return () => {
      cancelled = true
    }
  }, [setAvailableTimes])

  useEffect(() => {
    if (!visible) return
    const layer = makeHistoricalMapLayer(time, format)
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
  }, [map, visible, time, format])

  useEffect(() => {
    layerRef.current?.setOpacity(opacity)
  }, [opacity])

  // Second layer for the comparison edition, clipped to the right of the
  // swipe handle so `time`'s layer shows through on the left.
  useEffect(() => {
    if (!visible || !compareEnabled) return
    const layer = makeHistoricalMapLayer(compareTime, format)
    layer.setZIndex(0.6)
    layer.setOpacity(opacity)
    const unclip = clipLayerToSwipe(
      layer,
      map,
      () => useHistoricalMapsStore.getState().swipePosition / 100,
    )
    compareLayerRef.current = layer
    map.addLayer(layer)
    return () => {
      unclip()
      map.removeLayer(layer)
      compareLayerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, visible, compareEnabled, compareTime, format])

  useEffect(() => {
    compareLayerRef.current?.setOpacity(opacity)
  }, [opacity])

  // The clip fraction is read live from the store inside the render
  // handler; moving the handle still needs to trigger a repaint.
  useEffect(() => {
    if (compareEnabled && visible) map.render()
  }, [map, compareEnabled, visible, swipePosition])

  return compareEnabled && visible ? <SwipeHandle /> : null
}

/** Sidebar controls: on/off, opacity, the map edition and swipe compare. */
function HistoricalMapsPanel() {
  const visible = useHistoricalMapsStore((s) => s.visible)
  const opacity = useHistoricalMapsStore((s) => s.opacity)
  const time = useHistoricalMapsStore((s) => s.time)
  const availableTimes = useHistoricalMapsStore((s) => s.availableTimes)
  const compareEnabled = useHistoricalMapsStore((s) => s.compareEnabled)
  const compareTime = useHistoricalMapsStore((s) => s.compareTime)
  const swipePosition = useHistoricalMapsStore((s) => s.swipePosition)
  const setVisible = useHistoricalMapsStore((s) => s.setVisible)
  const setOpacity = useHistoricalMapsStore((s) => s.setOpacity)
  const setTime = useHistoricalMapsStore((s) => s.setTime)
  const setCompareEnabled = useHistoricalMapsStore((s) => s.setCompareEnabled)
  const setCompareTime = useHistoricalMapsStore((s) => s.setCompareTime)
  const setSwipePosition = useHistoricalMapsStore((s) => s.setSwipePosition)

  return (
    <section className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm text-black">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
          className="accent-ink"
          aria-label="Historische-Karten-Zeitreise ein-/ausblenden"
        />
        Historische Karte einblenden
      </label>

      <label className="flex flex-col gap-1">
        <span className="label-micro">
          {compareEnabled ? 'Kartenausgabe (linke Seite)' : 'Kartenausgabe'}
        </span>
        <select
          className="rounded-[3px] border border-hairline bg-sheet px-2 py-1 text-sm text-black disabled:opacity-50"
          value={time}
          disabled={!visible}
          onChange={(e) => setTime(e.target.value)}
          aria-label="Kartenausgabe wählen"
        >
          {availableTimes.map((t) => (
            <option key={t} value={t}>
              {timeLabel(t)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-black">
        <input
          type="checkbox"
          checked={compareEnabled}
          disabled={!visible}
          onChange={(e) => setCompareEnabled(e.target.checked)}
          className="accent-ink disabled:opacity-50"
          aria-label="Vergleichsmodus ein-/ausschalten"
        />
        Zwei Kartenausgaben vergleichen (Swipe)
      </label>

      {compareEnabled && (
        <>
          <label className="flex flex-col gap-1">
            <span className="label-micro">Kartenausgabe (rechte Seite)</span>
            <select
              className="rounded-[3px] border border-hairline bg-sheet px-2 py-1 text-sm text-black disabled:opacity-50"
              value={compareTime}
              disabled={!visible}
              onChange={(e) => setCompareTime(e.target.value)}
              aria-label="Vergleichs-Kartenausgabe wählen"
            >
              {availableTimes.map((t) => (
                <option key={t} value={t}>
                  {timeLabel(t)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="label-micro">Swipe-Position</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={swipePosition}
              disabled={!visible}
              onChange={(e) => setSwipePosition(Number(e.target.value))}
              className="disabled:opacity-50"
              aria-label="Swipe-Position zwischen den beiden Kartenausgaben"
            />
          </label>
        </>
      )}

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
          aria-label="Transparenz der historischen Karten-Ebene"
        />
      </label>
    </section>
  )
}

const historicalMapsFeature: FeatureModule = {
  id: 'historical-maps',
  label: 'Historische Karten',
  icon: '🗺️',
  MapSlot: HistoricalMapsLayer,
  SidebarPanel: HistoricalMapsPanel,
}

export default historicalMapsFeature
