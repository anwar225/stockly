import { Zap } from 'lucide-react'

interface LogoProps {
  collapsed?: boolean
}

export function Logo({ collapsed = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-200">
        <Zap size={18} fill="currentColor" />
      </div>
      {!collapsed && (
        <div>
          <p className="font-display text-lg font-bold leading-none tracking-tight text-slate-950">
            Stockly
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Gestion de magasin
          </p>
        </div>
      )}
    </div>
  )
}
