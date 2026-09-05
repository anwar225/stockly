import { LucideIcon } from 'lucide-react'

interface KpiProps {
  label: string
  value: string
  suffix?: string
  caption: string
  icon: LucideIcon
  tone: string
}

export function Kpi({ label, value, suffix, caption, icon: Icon, tone }: KpiProps) {
  const tones: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950">
            {value} {suffix && <span className="text-sm font-semibold text-slate-400">{suffix}</span>}
          </p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">{caption}</p>
    </div>
  )
}
