import Link from "next/link"
import { SiteHeader } from "@/components/site-header"

const folds = [
  { fold: "1", auc: "0.930", f1: "0.53", precision: "0.56", recall: "0.51", p20: "0.60" },
  { fold: "2", auc: "0.941", f1: "0.57", precision: "0.60", recall: "0.55", p20: "0.61" },
  { fold: "3", auc: "0.942", f1: "0.58", precision: "0.60", recall: "0.56", p20: "0.60" },
]

export default function ModelPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader active="model" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
        <p className="text-sm tracking-wide text-primary uppercase">The forecaster</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Gradient-boosted trees, one day ahead</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          GRIDLOCK uses LightGBM, a gradient boosting model made of decision trees. Each new tree
          is fit to the error left by the trees before it. The sum of those trees predicts{" "}
          <span className="font-mono text-foreground">log(1 + violations)</span> for every
          geohash-6 cell in Bengaluru — about 1.2 km across — on the next day.
        </p>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <Fact label="ROC-AUC" value="0.945" detail="3 rolling time folds" />
          <Fact label="Precision@20" value="0.61" detail="about 12 of the top 20" />
          <Fact label="Training rows" value="298k" detail="Jan–May challans" />
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-2xl tracking-wide">What a hotspot is</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The trees do not emit a class label. After they forecast intensity, cells are ranked.
            A hotspot is a cell in the busiest 5% that day. The probability on the desk is that
            rank, scaled across the 802 cells. Enforcement priority then multiplies it by road
            criticality: historical volume plus the share of trucks, buses, and other heavy
            vehicles. Cells with fewer than 50 records are scaled down so a thin sample cannot
            jump the queue.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-2xl tracking-wide">Signals the trees see</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Recent history for the same cell: 1, 2, 3, 7, and 14 days back.</li>
            <li>Rolling mean and volatility over 3, 7, and 14 days.</li>
            <li>A short trend: yesterday versus the same weekday last week.</li>
            <li>The cell’s own average, and its average on this weekday.</li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The strongest signal is the cell’s weekday average. Illegal parking follows a weekly
            rhythm tied to place. The shipped model drops six weak features and keeps that weekly
            signal. A check that removed every weekly feature left the score almost unchanged, so
            the result is not an artifact of when challans get filed.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-2xl tracking-wide">How it was scored</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Each fold trains on the past and tests on the next two weeks. A random split would let
            the model see the future.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-muted/60 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Fold</th>
                  <th className="px-3 py-2 font-medium">AUC</th>
                  <th className="px-3 py-2 font-medium">F1</th>
                  <th className="px-3 py-2 font-medium">Precision</th>
                  <th className="px-3 py-2 font-medium">Recall</th>
                  <th className="px-3 py-2 font-medium">P@20</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {folds.map((row) => (
                  <tr key={row.fold} className="border-t border-border">
                    <td className="px-3 py-2">{row.fold}</td>
                    <td className="px-3 py-2">{row.auc}</td>
                    <td className="px-3 py-2">{row.f1}</td>
                    <td className="px-3 py-2">{row.precision}</td>
                    <td className="px-3 py-2">{row.recall}</td>
                    <td className="px-3 py-2">{row.p20}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-border bg-card p-4">
          <h2 className="font-heading text-2xl tracking-wide">What this app runs</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The desk does not retrain the trees. It loads the saved next-day forecast — predicted
            intensity and hotspot rank for all 802 cells — and recomputes criticality and the
            patrol queue on the server whenever you move the freight weight, the slot count, or
            the ranking mode. Training lives in <span className="font-mono">ml/gridlock_pipeline.ipynb</span>.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
            Open the patrol desk
          </Link>
        </section>
      </main>
    </div>
  )
}

function Fact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-mono text-2xl text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}
