import { readFileSync } from "node:fs"
import path from "node:path"
import { rankCells } from "../lib/score"
import type { RawCell } from "../lib/types"

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
        } else inQuotes = false
      } else field += char
      continue
    }
    if (char === '"') inQuotes = true
    else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else if (char !== "\r") field += char
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  const [header, ...body] = rows.filter((record) => record.some((value) => value.length > 0))
  return body.map((record) => Object.fromEntries(header.map((key, index) => [key, record[index] ?? ""])))
}

const file = path.join(process.cwd(), "data", "dashboard_predictions.csv")
const raw: RawCell[] = parseCsv(readFileSync(file, "utf8")).map((row) => ({
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

const plan = rankCells(raw, { freightWeight: 0.4, capacity: 8, sort: "priority", freightOnly: false })
const top = plan.cells.filter((cell) => cell.inPlan)
const expected = ["tdr1v6", "tdr5p8", "tdr1y5", "tdr1v2", "tdr4hb", "tdr4zx"]
const got = top.map((cell) => cell.gh6)
const head = got.slice(0, expected.length)
if (head.join() !== expected.join()) {
  console.error("rank mismatch", head, expected)
  process.exit(1)
}
console.log(
  "ok",
  top.map((cell) => `${cell.rank} ${cell.gh6} ${cell.priority.toFixed(1)} ${cell.shortName}`).join("\n"),
)
