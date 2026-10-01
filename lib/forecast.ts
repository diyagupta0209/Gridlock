import { readFileSync } from "node:fs"
import path from "node:path"
import { rankCells } from "./score"
import type { PatrolPlan, RankOptions, RawCell } from "./types"

let cached: RawCell[] | null = null

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else if (char !== "\r") {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const [header, ...body] = rows.filter((record) => record.some((value) => value.length > 0))
  if (!header) return []
  return body.map((record) =>
    Object.fromEntries(header.map((key, index) => [key, record[index] ?? ""])),
  )
}

export function loadCells(): RawCell[] {
  if (cached) return cached
  const file = path.join(process.cwd(), "data", "dashboard_predictions.csv")
  const table = parseCsv(readFileSync(file, "utf8"))
  cached = table.map((row) => ({
    gh6: row.gh6,
    lat: Number(row.lat),
    lon: Number(row.lon),
    predIntensity: Number(row.pred_intensity),
    hotspotProb: Number(row.hotspot_prob),
    totalViol: Number(row.total_viol),
    heavyShare: Number(row.heavy_share),
    peakHour: Number(row.peak_hour),
    location: row.location,
  }))
  return cached
}

export function buildPlan(options: Partial<RankOptions>): PatrolPlan {
  return rankCells(loadCells(), options)
}
