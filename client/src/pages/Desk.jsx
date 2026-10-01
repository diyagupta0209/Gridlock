import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import PatrolMap from "../components/PatrolMap.jsx"
import { fetchJson } from "../api.js"
import { formatHour } from "../format.js"

export default function Desk() {
  const [capacity, setCapacity] = useState(12)
  const [freightPercent, setFreightPercent] = useState(40)
  const [sort, setSort] = useState("priority")
  const [freightOnly, setFreightOnly] = useState(false)
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [shiftName, setShiftName] = useState("Morning deployment")
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({
      capacity: String(capacity),
      freightWeight: String(freightPercent / 100),
      sort,
      freightOnly: freightOnly ? "1" : "0",
    })
    fetch(`/api/patrol?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || "Could not load the patrol plan.")
        return body
      })
      .then((next) => {
        setPlan(next)
        setError("")
        setSelectedId((current) => current ?? next.cells.find((cell) => cell.inPlan)?.gh6 ?? null)
      })
      .catch((reason) => {
        if (reason.name === "AbortError") return
        setError(reason.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [capacity, freightPercent, sort, freightOnly])

  const queue = plan?.cells.filter((cell) => cell.inPlan) ?? []
  const selected = useMemo(
    () => plan?.cells.find((cell) => cell.gh6 === selectedId) ?? null,
    [plan, selectedId],
  )

  async function savePlan(event) {
    event.preventDefault()
    setSaving(true)
    setSavedId("")
    setError("")
    try {
      const saved = await fetchJson("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: shiftName,
          capacity,
          freightWeight: freightPercent / 100,
          sort,
          freightOnly,
        }),
      })
      setSavedId(saved._id)
    } catch (reason) {
      setError(reason.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="desk">
      <section className="side">
        <div className="controls">
          <p className="kicker">Tomorrow’s deployment</p>
          <p className="lede">
            {plan?.source
              ? `Read ${plan.source.count} forecast cells from MongoDB database ${plan.source.database}, collection ${plan.source.collection}.`
              : "Reading the forecast from MongoDB."}{" "}
            Express multiplies each score by road criticality and keeps the top of the list.
          </p>
          <div className="stats">
            <div className="stat"><small>Cells from MongoDB</small><b>{plan?.source ? plan.source.count : "—"}</b></div>
            <div className="stat"><small>ROC-AUC</small><b>0.945</b></div>
            <div className="stat">
              <small>History covered</small>
              <b>{plan ? `${Math.round(plan.coverage.violationShare * 100)}%` : "—"}</b>
            </div>
          </div>
          <label className="field">
            <span className="field-head"><span>Patrol slots</span><span>{capacity}</span></span>
            <input type="range" min="4" max="30" value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} />
          </label>
          <label className="field">
            <span className="field-head"><span>Freight weight</span><span>{freightPercent}%</span></span>
            <input type="range" min="0" max="80" step="5" value={freightPercent} onChange={(event) => setFreightPercent(Number(event.target.value))} />
            <span className="hint">The rest is historical volume. 40% matches the trained ranking.</span>
          </label>
          <div className="row-actions">
            <button type="button" className={sort === "priority" ? "choice on" : "choice"} onClick={() => setSort("priority")}>Rank by impact</button>
            <button type="button" className={sort === "probability" ? "choice on" : "choice"} onClick={() => setSort("probability")}>Rank by hotspot</button>
          </div>
          <label className="switch-row">
            Freight corridors only
            <input type="checkbox" checked={freightOnly} onChange={(event) => setFreightOnly(event.target.checked)} />
          </label>
          <form className="save-row" onSubmit={savePlan}>
            <input value={shiftName} onChange={(event) => setShiftName(event.target.value)} aria-label="Deployment name" />
            <button className="primary" type="submit" disabled={saving || !plan}>{saving ? "Saving" : "Save"}</button>
          </form>
          {savedId ? <p className="hint">Stored in MongoDB. <Link to="/plans">Open saved deployments</Link>.</p> : null}
        </div>
        {loading && !plan ? <p className="empty">Reading the forecast from MongoDB…</p> : null}
        {error ? <p className="banner error">{error}</p> : null}
        {plan && queue.length === 0 ? <p className="empty">No cells match this filter.</p> : null}
        <ol className="queue">
          {queue.map((cell) => (
            <li key={cell.gh6}>
              <button type="button" className={selectedId === cell.gh6 ? "selected" : ""} onClick={() => setSelectedId(cell.gh6)}>
                <span className="rank">{cell.rank}</span>
                <span className="place">
                  <strong>
                    {cell.shortName}
                    {cell.freight ? <span className="badge">Freight</span> : null}
                  </strong>
                  <em>Peak {formatHour(cell.peakHour)}</em>
                </span>
                <span className="score">
                  <b>{cell.totalViol.toLocaleString()}</b>
                  <small>PAST</small>
                </span>
                <span className="score">
                  <b>{sort === "priority" ? cell.priority.toFixed(0) : cell.hotspotProb.toFixed(3)}</b>
                  <small>{sort === "priority" ? "IMPACT" : "PROB"}</small>
                </span>
              </button>
            </li>
          ))}
        </ol>
        {selected ? (
          <div className="detail">
            <small className="muted">{selected.gh6}</small>
            <h2>{selected.shortName}</h2>
            <p className="addr">{selected.location}</p>
            <div className="facts">
              <div><small>Past violations</small><b>{selected.totalViol.toLocaleString()}</b></div>
              <div><small>Predicted violations</small><b>{selected.predIntensity.toFixed(1)}</b></div>
              <div><small>Hotspot probability</small><b>{selected.hotspotProb.toFixed(2)}</b></div>
              <div><small>Road criticality</small><b>{selected.criticality.toFixed(2)}</b></div>
              <div><small>Priority</small><b>{selected.priority.toFixed(1)}</b></div>
            </div>
            <p className="hint">
              Priority = hotspot probability × criticality (
              {Math.round((plan?.weights.throughput ?? 0.6) * 100)}% volume,{" "}
              {Math.round((plan?.weights.freight ?? 0.4) * 100)}% heavy vehicles
              {selected.smallSample ? ", reduced for a small sample" : ""}). Heavy share{" "}
              {(selected.heavyShare * 100).toFixed(0)}%.
            </p>
          </div>
        ) : null}
      </section>
      <section className="map-wrap">
        <PatrolMap cells={plan?.cells ?? []} selected={selected} onSelect={setSelectedId} />
        <div className="legend">Larger marks are on tomorrow’s list. Color tracks enforcement priority.</div>
      </section>
    </div>
  )
}
