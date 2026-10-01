import { NextRequest } from "next/server"
import { buildPlan } from "@/lib/forecast"
import type { RankMode } from "@/lib/types"

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const sortParam = params.get("sort")
  const sort: RankMode = sortParam === "probability" ? "probability" : "priority"

  try {
    const plan = buildPlan({
      freightWeight: Number(params.get("freightWeight") ?? "0.4"),
      capacity: Number(params.get("capacity") ?? "12"),
      sort,
      freightOnly: params.get("freightOnly") === "1",
    })
    return Response.json(plan)
  } catch {
    return Response.json(
      { error: "The saved LightGBM forecast could not be loaded." },
      { status: 500 },
    )
  }
}
