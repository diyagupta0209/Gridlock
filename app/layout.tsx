import type { Metadata } from "next"
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
})

const plex = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "GRIDLOCK — patrol desk",
  description:
    "Next-day illegal-parking patrol plan for Bengaluru, ranked by a LightGBM forecast and road criticality.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${display.variable} ${plex.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
