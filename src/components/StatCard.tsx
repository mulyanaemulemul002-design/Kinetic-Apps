import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  label:     string
  value:     string
  sub?:      string
  icon:      LucideIcon
  color?:    string
  loading?:  boolean
}

export default function StatCard({ label, value, sub, icon: Icon, color = '#A8E6FF', loading }: StatCardProps) {
  const rgb = hexToRgb(color)

  if (loading) {
    return (
      <div className="card p-5">
        <div className="shimmer w-9 h-9 rounded-xl mb-4" />
        <div className="shimmer h-7 w-24 rounded-lg mb-2" />
        <div className="shimmer h-4 w-16 rounded-md" />
      </div>
    )
  }

  return (
    <div className="card p-5 hover:border-[rgba(168,230,255,0.14)] transition-all duration-200 group">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.18)` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-2xl font-bold text-white tabular-nums leading-tight">{value}</div>
      <div className="text-muted text-sm mt-0.5">{label}</div>
      {sub && <div className="text-subtle text-xs mt-1">{sub}</div>}
    </div>
  )
}

function hexToRgb(hex: string): string {
  if (!hex.startsWith('#')) return '168,230,255'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
