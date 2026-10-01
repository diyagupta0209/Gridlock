import { Desk } from "@/components/desk"
import { SiteHeader } from "@/components/site-header"

export default function HomePage() {
  return (
    <div className="flex h-dvh flex-col">
      <SiteHeader active="desk" />
      <Desk />
    </div>
  )
}
