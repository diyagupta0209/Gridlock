import Link from "next/link"

export function SiteHeader({ active }: { active: "desk" | "model" }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4 sm:px-5">
      <Link href="/" className="flex items-baseline gap-2">
        <span className="font-heading text-2xl font-semibold tracking-[0.14em]">GRIDLOCK</span>
        <span className="hidden text-xs tracking-wide text-muted-foreground sm:inline">
          Bengaluru patrol desk
        </span>
      </Link>
      <nav className="flex items-center gap-1 text-sm">
        <Link
          href="/"
          className={`rounded-lg px-3 py-1.5 ${active === "desk" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Desk
        </Link>
        <Link
          href="/model"
          className={`rounded-lg px-3 py-1.5 ${active === "model" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Model
        </Link>
      </nav>
    </header>
  )
}
