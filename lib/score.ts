import type { PatrolPlan, RankOptions, RawCell, ScoredCell } from "./types"

export const FREIGHT_SHARE = 0.75
export const SMALL_SAMPLE = 50
export const DEFAULT_FREIGHT_WEIGHT = 0.4

export const MODEL_CARD = {
  name: "LightGBM",
  algorithm: "Gradient boosting decision trees",
  target: "log(1 + next-day violations) per 1.2 km cell",
  cells: 802,
  days: 151,
  records: "298,000",
  rocAuc: 0.945,
  precisionAt20: 0.61,
  folds: 3,
} as const

export function shortPlace(location: string): string {
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean)
  const first = parts[0] ?? location
  if (/^unnamed road$/i.test(first)) {
    return parts[1] ?? first
  }
  return first
}

export function formatHour(hour: number): string {
  const h = ((Math.round(hour) % 24) + 24) % 24
  const suffix = h >= 12 ? "pm" : "am"
  const h12 = h % 12 || 12
  return `${h12}:00 ${suffix}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeOptions(input: Partial<RankOptions>): RankOptions {
  const freightWeight = clamp(
    Number.isFinite(input.freightWeight) ? Number(input.freightWeight) : DEFAULT_FREIGHT_WEIGHT,
    0,
    1,
  )
  const capacity = Math.round(
    clamp(Number.isFinite(input.capacity) ? Number(input.capacity) : 12, 1, 40),
  )
  const sort = input.sort === "probability" ? "probability" : "priority"
  return {
    freightWeight,
    capacity,
    sort,
    freightOnly: Boolean(input.freightOnly),
  }
}

export function rankCells(raw: RawCell[], input: Partial<RankOptions>): PatrolPlan {
  const options = normalizeOptions(input)
  const totals = raw.map((cell) => cell.totalViol)
  const minTotal = Math.min(...totals)
  const maxTotal = Math.max(...totals)
  const span = maxTotal - minTotal || 1
  const freightWeight = options.freightWeight
  const throughputWeight = 1 - freightWeight

  const blended = raw.map((cell) => {
    const throughput = (cell.totalViol - minTotal) / span
    const criticalityRaw = throughputWeight * throughput + freightWeight * cell.heavyShare
    return { cell, throughput, criticalityRaw }
  })

  const critValues = blended.map((row) => row.criticalityRaw)
  const minCrit = Math.min(...critValues)
  const maxCrit = Math.max(...critValues)
  const critSpan = maxCrit - minCrit || 1

  const scored: ScoredCell[] = blended.map(({ cell, throughput, criticalityRaw }) => {
    let criticality = (criticalityRaw - minCrit) / critSpan
    const smallSample = cell.totalViol < SMALL_SAMPLE
    if (smallSample) criticality *= 0.3
    const priority = cell.hotspotProb * criticality * 100
    return {
      ...cell,
      shortName: shortPlace(cell.location),
      throughput,
      criticality,
      priority,
      freight: cell.heavyShare >= FREIGHT_SHARE,
      smallSample,
      rank: 0,
      inPlan: false,
    }
  })

  const eligible = scored.filter((cell) => (options.freightOnly ? cell.freight : true))
  eligible.sort((a, b) => {
    const primary =
      options.sort === "probability" ? b.hotspotProb - a.hotspotProb : b.priority - a.priority
    if (primary !== 0) return primary
    return b.predIntensity - a.predIntensity
  })

  const planIds = new Set(eligible.slice(0, options.capacity).map((cell) => cell.gh6))
  const rankById = new Map(eligible.map((cell, index) => [cell.gh6, index + 1]))

  const cells = scored
    .map((cell) => ({
      ...cell,
      rank: rankById.get(cell.gh6) ?? 0,
      inPlan: planIds.has(cell.gh6),
    }))
    .sort((a, b) => {
      if (a.inPlan !== b.inPlan) return a.inPlan ? -1 : 1
      if (a.rank === 0) return 1
      if (b.rank === 0) return -1
      return a.rank - b.rank
    })

  const plan = cells.filter((cell) => cell.inPlan)
  const violationTotal = raw.reduce((sum, cell) => sum + cell.totalViol, 0) || 1
  const violationShare = plan.reduce((sum, cell) => sum + cell.totalViol, 0) / violationTotal

  return {
    model: MODEL_CARD,
    weights: { throughput: throughputWeight, freight: freightWeight },
    sort: options.sort,
    capacity: options.capacity,
    freightOnly: options.freightOnly,
    coverage: {
      considered: eligible.length,
      deployed: plan.length,
      violationShare,
      freightInPlan: plan.filter((cell) => cell.freight).length,
    },
    cells,
  }
}
