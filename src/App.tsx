import { features } from './features/registry'
import { MapView } from './map/MapView'

function App() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-baseline gap-4 border-b border-hairline bg-sheet px-4 pt-2.5 pb-2">
        <h1 className="leading-none">
          {/* Wordmark with the Landeskarte-red brand tick */}
          <span
            className="block text-lg font-bold tracking-tight text-ink"
            style={{ fontStretch: '112%' }}
          >
            CrowdGIS
          </span>
          <span aria-hidden className="mt-1 block h-0.5 w-7 bg-signal" />
        </h1>
        <p className="hidden text-sm text-stone sm:block">
          Das GIS, das Studierende weiterentwickeln
        </p>
        <div className="ml-auto flex items-center gap-2">
          {features.map((f) =>
            f.HeaderItem ? <f.HeaderItem key={f.id} /> : null,
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-72 shrink-0 flex-col gap-5 overflow-y-auto border-r border-hairline bg-sheet p-3">
          {features.map((f) =>
            f.SidebarPanel ? <f.SidebarPanel key={f.id} /> : null,
          )}
        </aside>

        <main className="relative min-w-0 flex-1">
          <MapView />
          {/* Floating toolbar for feature controls, above the Leaflet panes */}
          <div className="pointer-events-none absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2">
            {features.map((f) =>
              f.ToolbarItem ? (
                <div key={f.id} className="pointer-events-auto">
                  <f.ToolbarItem />
                </div>
              ) : null,
            )}
          </div>
          {features.map((f) =>
            f.Overlay ? <f.Overlay key={f.id} /> : null,
          )}
        </main>
      </div>

      {features.map((f) =>
        f.BottomPanel ? <f.BottomPanel key={f.id} /> : null,
      )}

      <footer className="flex h-8 items-center gap-5 border-t border-hairline bg-sheet px-4 text-xs">
        {features.map((f) =>
          f.StatusBarItem ? <f.StatusBarItem key={f.id} /> : null,
        )}
      </footer>
    </div>
  )
}

export default App
