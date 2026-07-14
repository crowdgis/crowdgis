import { useEffect, useRef } from 'react'
import type TileLayer from 'ol/layer/Tile'
import { useOlMap } from '../../map/OlMap'
import type { FeatureModule } from '../types'
import { fetchSwissimageTimes } from './capabilities'
import { clipLayerToSwipe, makeSwissimageLayer } from './layer'
import { useSwissimageTimetravelStore } from './store'

/** Displays the year value of a Value string, e.g. '20230101' -> '2023'. */
function timeLabel(time: string): string {
  return time === 'current' ? 'Aktuell' : time.slice(0, 4)
}

/** Draggable vertical handle that moves the swipe position on the map. */
function SwipeHandle() {
  const map = useOlMap()
  const swipePosition = useSwissimageTimetravelStore((s) => s.swipePosition)
  const setSwipePosition = useSwissimageTimetravelStore(
    (s) => s.setSwipePosition,
  )
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
      aria-label="Swipe-Regler für Luftbildvergleich"
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

/** Mounts the SwissImage time-travel layer(s) while switched on. */
function SwissimageTimetravelLayer() {
  const map = useOlMap()
  const visible = useSwissimageTimetravelStore((s) => s.visible)
  const opacity = useSwissimageTimetravelStore((s) => s.opacity)
  const time = useSwissimageTimetravelStore((s) => s.time)
  const compareEnabled = useSwissimageTimetravelStore((s) => s.compareEnabled)
  const compareTime = useSwissimageTimetravelStore((s) => s.compareTime)
  const swipePosition = useSwissimageTimetravelStore((s) => s.swipePosition)
  const setAvailableTimes = useSwissimageTimetravelStore(
    (s) => s.setAvailableTimes,
  )
  const layerRef = useRef<TileLayer | null>(null)
  const compareLayerRef = useRef<TileLayer | null>(null)

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

  // Second layer for the comparison year, clipped to the right of the
  // swipe handle so `time`'s layer shows through on the left.
  useEffect(() => {
    if (!visible || !compareEnabled) return
    const layer = makeSwissimageLayer(compareTime)
    layer.setZIndex(0.6)
    layer.setOpacity(opacity)
    const unclip = clipLayerToSwipe(
      layer,
      map,
      () => useSwissimageTimetravelStore.getState().swipePosition / 100,
    )
    compareLayerRef.current = layer
    map.addLayer(layer)
    return () => {
      unclip()
      map.removeLayer(layer)
      compareLayerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, visible, compareEnabled, compareTime])

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

/** Sidebar controls: on/off, opacity, the historical year and swipe compare. */
function SwissimageTimetravelPanel() {
  const visible = useSwissimageTimetravelStore((s) => s.visible)
  const opacity = useSwissimageTimetravelStore((s) => s.opacity)
  const time = useSwissimageTimetravelStore((s) => s.time)
  const availableTimes = useSwissimageTimetravelStore((s) => s.availableTimes)
  const compareEnabled = useSwissimageTimetravelStore((s) => s.compareEnabled)
  const compareTime = useSwissimageTimetravelStore((s) => s.compareTime)
  const swipePosition = useSwissimageTimetravelStore((s) => s.swipePosition)
  const setVisible = useSwissimageTimetravelStore((s) => s.setVisible)
  const setOpacity = useSwissimageTimetravelStore((s) => s.setOpacity)
  const setTime = useSwissimageTimetravelStore((s) => s.setTime)
  const setCompareEnabled = useSwissimageTimetravelStore(
    (s) => s.setCompareEnabled,
  )
  const setCompareTime = useSwissimageTimetravelStore((s) => s.setCompareTime)
  const setSwipePosition = useSwissimageTimetravelStore(
    (s) => s.setSwipePosition,
  )

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
        <span className="label-micro">
          {compareEnabled ? 'Aufnahmejahr (linke Seite)' : 'Aufnahmejahr'}
        </span>
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

      <label className="flex items-center gap-2 text-sm text-black">
        <input
          type="checkbox"
          checked={compareEnabled}
          disabled={!visible}
          onChange={(e) => setCompareEnabled(e.target.checked)}
          className="accent-ink disabled:opacity-50"
          aria-label="Vergleichsmodus ein-/ausschalten"
        />
        Zwei Jahre vergleichen (Swipe)
      </label>

      {compareEnabled && (
        <>
          <label className="flex flex-col gap-1">
            <span className="label-micro">Vergleichsjahr (rechte Seite)</span>
            <select
              className="rounded-[3px] border border-hairline bg-sheet px-2 py-1 text-sm text-black disabled:opacity-50"
              value={compareTime}
              disabled={!visible}
              onChange={(e) => setCompareTime(e.target.value)}
              aria-label="Vergleichsjahr wählen"
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
              aria-label="Swipe-Position zwischen den beiden Aufnahmejahren"
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
