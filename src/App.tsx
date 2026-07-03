import { features } from './features/registry'
import { MapView } from './map/MapView'

function App() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
        <h1 className="text-lg font-semibold text-gray-800">CrowdGIS</h1>
        <span className="text-sm text-gray-500">
          Das GIS, das Studierende weiterentwickeln
        </span>
      </header>

      <main className="relative min-h-0 flex-1">
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
      </main>

      <footer className="flex items-center gap-4 border-t border-gray-200 bg-white px-4 py-1 text-sm text-gray-700">
        {features.map((f) =>
          f.StatusBarItem ? <f.StatusBarItem key={f.id} /> : null,
        )}
      </footer>
    </div>
  )
}

export default App
