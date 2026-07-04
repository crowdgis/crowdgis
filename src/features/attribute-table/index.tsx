import { useMemo, useState } from 'react'
import { bbox } from '@turf/turf'
import type { Feature } from 'geojson'
import { useLayerStore } from '../../state/layerStore'
import type { FeatureModule } from '../types'
import { applyFilter } from './filter'

/** Cap rendered rows to keep the DOM responsive on large datasets. */
const MAX_ROWS = 200

/** Union of property keys across features (first pass sample). */
export function collectColumns(features: Feature[]): string[] {
  const keys = new Set<string>()
  for (const f of features.slice(0, 500)) {
    for (const key of Object.keys(f.properties ?? {})) keys.add(key)
  }
  return [...keys]
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '–'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Bottom panel: attribute table of the selected vector layer. */
function AttributeTablePanel() {
  const layerId = useLayerStore((s) => s.attributeTableLayerId)
  const layer = useLayerStore((s) =>
    s.layers.find((l) => l.id === s.attributeTableLayerId),
  )
  const close = useLayerStore((s) => s.setAttributeTableLayer)
  const requestZoom = useLayerStore((s) => s.requestZoom)

  const [filterExpr, setFilterExpr] = useState('')

  const geojson = layer?.source.kind === 'vector' ? layer.source.geojson : null
  const features = useMemo(() => geojson?.features ?? [], [geojson])
  const columns = useMemo(() => collectColumns(features), [features])
  const { features: filteredFeatures, error: filterError } = useMemo(
    () => applyFilter(features, filterExpr),
    [features, filterExpr],
  )

  if (!layerId || !layer || layer.source.kind !== 'vector') return null

  function zoomToFeature(feature: Feature) {
    try {
      const [west, south, east, north] = bbox(feature)
      if ([west, south, east, north].every(Number.isFinite)) {
        requestZoom([
          [south, west],
          [north, east],
        ])
      }
    } catch {
      // Features without geometry cannot be zoomed to.
    }
  }

  return (
    <div className="flex h-56 shrink-0 flex-col border-t border-hairline bg-sheet">
      <div className="flex items-center gap-3 border-b border-hairline px-3 py-1.5">
        <h2 className="label-micro">Attributtabelle</h2>
        <span className="truncate text-sm text-black">{layer.name}</span>
        <span className="text-xs text-stone">
          {filterExpr.trim() && !filterError
            ? `${filteredFeatures.length} von ${features.length} Objekten`
            : `${features.length} ${features.length === 1 ? 'Objekt' : 'Objekte'}`}
          {filteredFeatures.length > MAX_ROWS && `, erste ${MAX_ROWS} angezeigt`}
        </span>
        <button
          type="button"
          onClick={() => close(null)}
          aria-label="Attributtabelle schliessen"
          className="ml-auto rounded-[3px] px-1.5 text-stone hover:text-signal"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-2 border-b border-hairline px-3 py-1.5">
        <input
          type="text"
          value={filterExpr}
          onChange={(e) => setFilterExpr(e.target.value)}
          placeholder="Filter, z. B. bewohner > 100 AND jahr = 2020"
          aria-label="Attribute filtern"
          className="w-full rounded-[3px] border border-hairline bg-paper px-2 py-1 font-mono text-xs text-black placeholder:text-stone"
        />
        {filterError && (
          <span className="shrink-0 text-xs text-signal">{filterError}</span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-paper">
            <tr>
              <th className="label-micro border-b border-hairline px-2 py-1 text-left">
                #
              </th>
              {columns.map((c) => (
                <th
                  key={c}
                  className="border-b border-hairline px-2 py-1 text-left font-semibold text-black"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredFeatures.slice(0, MAX_ROWS).map((f, i) => (
              <tr
                key={i}
                onClick={() => zoomToFeature(f)}
                className="cursor-pointer border-b border-hairline hover:bg-paper"
                title="Klicken, um auf das Objekt zu zoomen"
              >
                <td className="px-2 py-1 font-mono text-stone">{i + 1}</td>
                {columns.map((c) => (
                  <td key={c} className="max-w-56 truncate px-2 py-1">
                    {formatValue(f.properties?.[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const attributeTableFeature: FeatureModule = {
  id: 'attribute-table',
  label: 'Attributtabelle',
  BottomPanel: AttributeTablePanel,
}

export default attributeTableFeature
