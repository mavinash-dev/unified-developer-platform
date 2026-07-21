import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Resume {
  id: number
  company: string
  role: string
  ats_score: number | null
  format: string
  compatibility: string | null
  created_at: string
}

function scoreColor(score: number | null) {
  if (!score) return 'bg-muted text-muted-foreground'
  if (score >= 85) return 'bg-green-100 text-green-800'
  if (score >= 70) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

export default function ResumeCard({ resume }: { resume: Resume }) {
  const date = new Date(resume.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">
            {resume.company || 'General'} {resume.role ? `— ${resume.role}` : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{date} · {resume.format}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {resume.compatibility && (
            <Badge variant="outline" className="text-xs">{resume.compatibility}</Badge>
          )}
          {resume.ats_score != null && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${scoreColor(resume.ats_score)}`}>
              ATS {resume.ats_score.toFixed(0)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
