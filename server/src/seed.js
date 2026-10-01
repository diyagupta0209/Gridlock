import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseCsv } from "./csv.js"
import { Cell } from "./models.js"

const here = path.dirname(fileURLToPath(import.meta.url))

export function forecastPath() {
  return process.env.FORECAST_CSV || path.resolve(here, "../../data/dashboard_predictions.csv")
}

export function readForecast() {
  const table = parseCsv(readFileSync(forecastPath(), "utf8"))
  return table.map((row) => ({
    gh6: row.gh6,
    lat: Number(row.lat),
    lon: Number(row.lon),
    location: row.location,
    predIntensity: Number(row.pred_intensity),
    hotspotProb: Number(row.hotspot_prob),
    totalViol: Number(row.total_viol),
    heavyShare: Number(row.heavy_share),
    peakHour: Number(row.peak_hour),
  }))
}

export async function seedIfEmpty() {
  const existing = await Cell.estimatedDocumentCount()
  if (existing > 0) return existing
  const cells = readForecast()
  await Cell.insertMany(cells, { ordered: false })
  return cells.length
}
