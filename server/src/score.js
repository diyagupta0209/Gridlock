import { DEFAULT_FREIGHT_WEIGHT, FREIGHT_SHARE, MODEL_CARD, SMALL_SAMPLE } from "./modelCard.js"

export function shortPlace(location) {
  const parts = String(location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
  const first = parts[0] || location
  if (/^unnamed road$/i.test(first)) return parts[1] || first
  return first
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeOptions(input = {}) {
  const freightWeight = clamp(
    Number.isFinite(Number(input.freightWeight)) ? Number(input.freightWeight) : DEFAULT_FREIGHT_WEIGHT,
    0,
    1,
  )
  const capacity = Math.round(
    clamp(Number.isFinite(Number(input.capacity)) ? Number(input.capacity) : 12, 1, 40),
  )
  return {
    freightWeight,
    capacity,
    sort: input.sort === "probability" ? "probability" : "priority",
    freightOnly: input.freightOnly === true || input.freightOnly === "1" || input.freightOnly === "true",
  }
}

export function rankCells(raw, input) {
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

  const scored = blended.map(({ cell, throughput, criticalityRaw }) => {
    let criticality = (criticalityRaw - minCrit) / critSpan
    const smallSample = cell.totalViol < SMALL_SAMPLE
    if (smallSample) criticality *= 0.3
    return {
      gh6: cell.gh6,
      lat: cell.lat,
      lon: cell.lon,
      location: cell.location,
      predIntensity: cell.predIntensity,
      hotspotProb: cell.hotspotProb,
      totalViol: cell.totalViol,
      heavyShare: cell.heavyShare,
      peakHour: cell.peakHour,
      shortName: shortPlace(cell.location),
      throughput,
      criticality,
      priority: cell.hotspotProb * criticality * 100,
      freight: cell.heavyShare >= FREIGHT_SHARE,
      smallSample,
      rank: 0,
      inPlan: false,
    }
  })

  const eligible = scored.filter((cell) => (options.freightOnly ? cell.freight : true))
  eligible.sort((a, b) => {
    const primary = options.sort === "probability" ? b.hotspotProb - a.hotspotProb : b.priority - a.priority
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

  return {
    model: MODEL_CARD,
    weights: { throughput: throughputWeight, freight: freightWeight },
    sort: options.sort,
    capacity: options.capacity,
    freightOnly: options.freightOnly,
    coverage: {
      considered: eligible.length,
      deployed: plan.length,
      violationShare: plan.reduce((sum, cell) => sum + cell.totalViol, 0) / violationTotal,
      freightInPlan: plan.filter((cell) => cell.freight).length,
    },
    cells,
  }
}
