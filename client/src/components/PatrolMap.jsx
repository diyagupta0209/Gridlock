import { useEffect } from "react"
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet"
import { formatHour } from "../format.js"
import "leaflet/dist/leaflet.css"

function FlyTo({ cell }) {
  const map = useMap()
  useEffect(() => {
    if (!cell) return
    map.flyTo([cell.lat, cell.lon], Math.max(map.getZoom(), 13), { duration: 0.5 })
  }, [cell, map])
  return null
}

function heat(priority) {
  const t = Math.max(0, Math.min(1, priority / 100))
  return `hsl(18 ${30 + t * 55}% ${28 + t * 42}%)`
}

export default function PatrolMap({ cells, selected, onSelect }) {
  return (
    <MapContainer center={[12.97, 77.59]} zoom={11} scrollWheelZoom>
      <TileLayer
        attribution="Tiles &copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxZoom={16}
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
            <strong>{cell.shortName}</strong>
            <div>{cell.gh6}</div>
            <div>Priority {cell.priority.toFixed(1)}</div>
            <div>Peak {formatHour(cell.peakHour)}</div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
