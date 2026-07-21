import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import Sidebar from "@/components/Sidebar"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Unified Dev Dashboard",
  description: "Career intelligence platform — resume builder, ATS scorer, job scout",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="h-screen flex overflow-hidden" style={{ background: 'var(--canvas)' }}>
        <Suspense fallback={<div style={{ width: 260, background: 'var(--surface)', borderRight: '1px solid var(--border-subtle)', flexShrink: 0 }} />}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </body>
    </html>
  )
}
