import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon:        LucideIcon
  title:       string
  description: string
  action?:     React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(168,230,255,0.06)', border: '1px solid rgba(168,230,255,0.1)' }}>
        <Icon className="w-6 h-6 text-muted" />
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-muted text-sm max-w-xs mb-5">{description}</p>
      {action}
    </div>
  )
}
