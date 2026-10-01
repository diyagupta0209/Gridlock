"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { formatHour } from "@/lib/score"
import type { PatrolPlan, RankMode, ScoredCell } from "@/lib/types"

const PatrolMap = dynamic(
  () => import("@/components/patrol-map").then((mod) => mod.PatrolMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading the Bengaluru grid…
      </div>
    ),
  },
)

const DEFAULT_CAPACITY = 12
const DEFAULT_FREIGHT = 40

export function Desk() {
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY)
  const [freightPercent, setFreightPercent] = useState(DEFAULT_FREIGHT)
  const [sort, setSort] = useState<RankMode>("priority")
  const [freightOnly, setFreightOnly] = useState(false)
  const [plan, setPlan] = useState<PatrolPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({
      capacity: String(capacity),
      freightWeight: String(freightPercent / 100),
      sort,
      freightOnly: freightOnly ? "1" : "0",
    })
    fetch(`/api/patrol?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("The patrol API did not return a plan.")
        return (await response.json()) as PatrolPlan
      })
      .then((next) => {
        setPlan(next)
        setError(null)
        setSelectedId((current) => current ?? next.cells.find((cell) => cell.inPlan)?.gh6 ?? null)
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return
        setError(reason instanceof Error ? reason.message : "Could not load the forecast.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [capacity, freightPercent, sort, freightOnly])

  const selected = useMemo(
    () => plan?.cells.find((cell) => cell.gh6 === selectedId) ?? null,
    [plan, selectedId],
  )
  const queue = plan?.cells.filter((cell) => cell.inPlan) ?? []

  return (
    <div className="grid min-h-0 flex-1 lg:grid-cols-[400px_minmax(0,1fr)]">
      <section className="flex min-h-0 flex-col border-b border-border lg:border-r lg:border-b-0">
        <div className="space-y-4 border-b border-border p-4">
          <div>
            <p className="font-heading text-lg tracking-wide text-primary">Tomorrow’s deployment</p>
            <p className="mt-1 text-sm text-muted-foreground">
              LightGBM scores each cell. This desk multiplies that score by road criticality and
              keeps the top of the list.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Cells" value={plan ? String(plan.model.cells) : "—"} />
            <Stat label="ROC-AUC" value="0.945" />
            <Stat
              label="History covered"
              value={plan ? `${Math.round(plan.coverage.violationShare * 100)}%` : "—"}
            />
          </div>
          <label className="block space-y-2">
            <span className="flex items-center justify-between text-sm">
              Patrol slots
              <span className="font-mono text-xs text-primary">{capacity}</span>
            </span>
            <Slider
              min={4}
              max={30}
              step={1}
              value={[capacity]}
              onValueChange={(value) => setCapacity(readSlider(value, capacity))}
            />
          </label>
          <label className="block space-y-2">
            <span className="flex items-center justify-between text-sm">
              Freight weight
              <span className="font-mono text-xs text-primary">{freightPercent}%</span>
            </span>
            <Slider
              min={0}
              max={80}
              step={5}
              value={[freightPercent]}
              onValueChange={(value) => setFreightPercent(readSlider(value, freightPercent))}
            />
            <span className="block text-xs text-muted-foreground">
              The rest of criticality is historical volume. Default is 40% freight, matching the
              trained ranking.
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={sort === "priority" ? "default" : "outline"}
              onClick={() => setSort("priority")}
            >
              Rank by impact
            </Button>
            <Button
              size="sm"
              variant={sort === "probability" ? "default" : "outline"}
              onClick={() => setSort("probability")}
            >
              Rank by hotspot
            </Button>
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Freight corridors only</span>
            <Switch checked={freightOnly} onCheckedChange={setFreightOnly} />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && !plan ? (
            <p className="p-4 text-sm text-muted-foreground">Reading the saved forecast…</p>
          ) : null}
          {error ? (
            <div className="m-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
              {error}
            </div>
          ) : null}
          {plan && queue.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No cells match this filter. Turn off freight-only to see the full city ranking.
            </p>
          ) : null}
          <ol>
            {queue.map((cell) => (
              <li key={cell.gh6}>
                <button
                  type="button"
                  onClick={() => setSelectedId(cell.gh6)}
                  className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left hover:bg-secondary/70 ${
                    selectedId === cell.gh6 ? "bg-secondary" : ""
                  }`}
                >
                  <span className="font-mono w-6 pt-0.5 text-xs text-muted-foreground">
                    {cell.rank}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{cell.shortName}</span>
                      {cell.freight ? <Badge>Freight</Badge> : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Peak {formatHour(cell.peakHour)} · {cell.totalViol.toLocaleString()} past
                      violations
                    </span>
                  </span>
                  <span className="font-mono text-sm text-primary">{cell.priority.toFixed(0)}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        {selected ? <CellDetail cell={selected} weights={plan?.weights} /> : null}
      </section>

      <section className="relative h-[48vh] min-h-72 lg:h-auto">
        <PatrolMap cells={plan?.cells ?? []} selected={selected} onSelect={setSelectedId} />
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs text-muted-foreground">
          Larger marks are on tomorrow’s list. Color tracks enforcement priority.
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/70 px-2.5 py-2">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-mono text-sm">{value}</p>
    </div>
  )
}

function CellDetail({
  cell,
  weights,
}: {
  cell: ScoredCell
  weights?: { throughput: number; freight: number }
}) {
  return (
    <div className="border-t border-border bg-card p-4">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{cell.gh6}</p>
      <h2 className="font-heading text-xl leading-tight">{cell.shortName}</h2>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{cell.location}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <Row label="Predicted violations" value={cell.predIntensity.toFixed(1)} />
        <Row label="Hotspot probability" value={cell.hotspotProb.toFixed(2)} />
        <Row label="Road criticality" value={cell.criticality.toFixed(2)} />
        <Row label="Priority" value={cell.priority.toFixed(1)} />
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Priority is hotspot probability times criticality. Criticality is{" "}
        {Math.round((weights?.throughput ?? 0.6) * 100)}% volume and{" "}
        {Math.round((weights?.freight ?? 0.4) * 100)}% heavy vehicles
        {cell.smallSample ? ". This cell has a small sample, so criticality is reduced." : "."}{" "}
        Heavy share {(cell.heavyShare * 100).toFixed(0)}%.
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  )
}

function readSlider(value: number | readonly number[], fallback: number) {
  if (typeof value === "number") return value
  return value[0] ?? fallback
}
