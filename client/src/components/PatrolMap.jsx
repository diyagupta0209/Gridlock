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

function riskColor(priority) {
  const t = Math.max(0, Math.min(1, priority / 100))
  const stops = [
    { at: 0, color: [245, 208, 40] },
    { at: 0.45, color: [240, 138, 28] },
    { at: 1, color: [214, 48, 32] },
  ]
  let lower = stops[0]
  let upper = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (t >= stops[i].at && t <= stops[i + 1].at) {
      lower = stops[i]
      upper = stops[i + 1]
      break
    }
  }
  const span = upper.at - lower.at || 1
  const mix = (t - lower.at) / span
  const rgb = lower.color.map((channel, index) => Math.round(channel + (upper.color[index] - channel) * mix))
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
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
            color: cell.gh6 === selected?.gh6 ? "#f6f1e8" : riskColor(cell.priority),
            weight: cell.gh6 === selected?.gh6 ? 2 : 1,
            fillColor: riskColor(cell.priority),
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
