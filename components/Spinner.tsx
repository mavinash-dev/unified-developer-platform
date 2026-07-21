interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  color?: string
  count?: number
}

const DOT_SIZE = { xs: 4, sm: 5, md: 6, lg: 8 }
const GAP = { xs: 3, sm: 4, md: 5, lg: 6 }

export default function Spinner({ size = 'md', color = 'var(--accent-primary)', count = 3 }: Props) {
  const px = DOT_SIZE[size]
  const gap = GAP[size]
  return (
    <span className="inline-flex items-end shrink-0" style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="rounded-full inline-block"
          style={{
            width: px,
            height: px,
            background: color,
            animation: 'udd-bounce 1.1s ease-in-out infinite',
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes udd-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-${px + 2}px); opacity: 1; }
        }
      `}</style>
    </span>
  )
}
