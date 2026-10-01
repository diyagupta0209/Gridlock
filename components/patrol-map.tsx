"use client"

import { useEffect } from "react"
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet"
import type { ScoredCell } from "@/lib/types"
import { formatHour } from "@/lib/score"
import "leaflet/dist/leaflet.css"

function FlyTo({ cell }: { cell: ScoredCell | null }) {
  const map = useMap()
  useEffect(() => {
    if (!cell) return
    map.flyTo([cell.lat, cell.lon], Math.max(map.getZoom(), 13), { duration: 0.55 })
  }, [cell, map])
  return null
}

function heat(priority: number) {
  const t = Math.max(0, Math.min(1, priority / 100))
  const light = 28 + t * 42
  return `hsl(18 ${30 + t * 55}% ${light}%)`
}

export function PatrolMap({
  cells,
  selected,
  onSelect,
}: {
  cells: ScoredCell[]
  selected: ScoredCell | null
  onSelect: (gh6: string) => void
}) {
  return (
    <MapContainer
      center={[12.97, 77.59]}
      zoom={11}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FlyTo cell={selected} />
      {cells.map((cell) => (
        <CircleMarker
          key={cell.gh6}
          center={[cell.lat, cell.lon]}
          radius={cell.inPlan ? 9 : 4}
          pathOptions={{
            color: cell.gh6 === selected?.gh6 ? "#f6f1e8" : heat(cell.priority),
            weight: cell.gh6 === selected?.gh6 ? 2 : 1,
            fillColor: heat(cell.priority),
            fillOpacity: cell.inPlan ? 0.92 : 0.45,
          }}
          eventHandlers={{ click: () => onSelect(cell.gh6) }}
        >
          <Popup>
            <div className="min-w-40">
              <p className="font-semibold">{cell.shortName}</p>
              <p className="text-xs opacity-80">{cell.gh6}</p>
              <p className="mt-1 text-sm">Priority {cell.priority.toFixed(1)}</p>
              <p className="text-xs">Peak {formatHour(cell.peakHour)}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
