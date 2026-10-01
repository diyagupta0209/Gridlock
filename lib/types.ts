export type RawCell = {
  gh6: string
  lat: number
  lon: number
  predIntensity: number
  hotspotProb: number
  totalViol: number
  heavyShare: number
  peakHour: number
  location: string
}

export type ScoredCell = RawCell & {
  shortName: string
  throughput: number
  criticality: number
  priority: number
  freight: boolean
  smallSample: boolean
  rank: number
  inPlan: boolean
}

export type RankMode = "priority" | "probability"

export type RankOptions = {
  freightWeight: number
  capacity: number
  sort: RankMode
  freightOnly: boolean
}

export type PatrolPlan = {
  model: {
    name: string
    algorithm: string
    target: string
    cells: number
    days: number
    records: string
    rocAuc: number
    precisionAt20: number
    folds: number
  }
  weights: {
    throughput: number
    freight: number
  }
  sort: RankMode
  capacity: number
  freightOnly: boolean
  coverage: {
    considered: number
    deployed: number
    violationShare: number
    freightInPlan: number
  }
  cells: ScoredCell[]
}
