'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface TokenData {
  daily: { total: number; in: number; out: number; limit: number; pct: number }
  monthly: { total: number; in: number; out: number; limit: number; pct: number }
  bySkill: { skill: string; tokens_in: number; tokens_out: number }[]
}

function fmt(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function statusColor(pct: number) {
  if (pct >= 90) return 'text-red-500'
  if (pct >= 75) return 'text-yellow-500'
  return 'text-green-500'
}

export default function TokenMeter() {
  const [data, setData] = useState<TokenData | null>(null)

  useEffect(() => {
    fetch('/api/tokens').then(r => r.json()).then(setData)
    const id = setInterval(() => {
      fetch('/api/tokens').then(r => r.json()).then(setData)
    }, 30000)
    return () => clearInterval(id)
  }, [])

  if (!data) return (
    <Card className="animate-pulse">
      <CardHeader><CardTitle>Token Usage</CardTitle></CardHeader>
      <CardContent><div className="h-16 bg-muted rounded" /></CardContent>
    </Card>
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Claude Token Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Today</span>
            <span className={statusColor(data.daily.pct)}>
              {fmt(data.daily.total)} / {fmt(data.daily.limit)} ({data.daily.pct}%)
            </span>
          </div>
          <Progress value={data.daily.pct} className="h-2" />
          {data.daily.pct >= 80 && (
            <p className="text-xs text-yellow-600 mt-1">⚠ Approaching daily limit</p>
          )}
        </div>

        {/* Monthly */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">This Month</span>
            <span className={statusColor(data.monthly.pct)}>
              {fmt(data.monthly.total)} / {fmt(data.monthly.limit)} ({data.monthly.pct}%)
            </span>
          </div>
          <Progress value={data.monthly.pct} className="h-2" />
        </div>

        {/* By skill */}
        {data.bySkill.length > 0 && (
          <div className="pt-1">
            <p className="text-xs text-muted-foreground mb-2">Today by skill</p>
            <div className="flex gap-2 flex-wrap">
              {data.bySkill.map(s => (
                <Badge key={s.skill} variant="secondary" className="text-xs">
                  {s.skill}: {fmt(s.tokens_in + s.tokens_out)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
