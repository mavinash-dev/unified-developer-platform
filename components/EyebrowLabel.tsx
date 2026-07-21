interface Props {
  children: React.ReactNode
  className?: string
  color?: string
}

export default function EyebrowLabel({ children, className = '', color }: Props) {
  return (
    <p className={`eyebrow ${className}`} style={color ? { color } : undefined}>
      {children}
    </p>
  )
}
