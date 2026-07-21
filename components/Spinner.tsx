interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  color?: string
}

const SIZES = { xs: 12, sm: 16, md: 20, lg: 32 }

export default function Spinner({ size = 'md', color = 'var(--accent-primary)' }: Props) {
  const px = SIZES[size]
  return (
    <div
      className="rounded-full border-2 animate-spin shrink-0"
      style={{
        width: px,
        height: px,
        borderColor: color,
        borderTopColor: 'transparent',
      }}
    />
  )
}
