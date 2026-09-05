import { Bell, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Menu, Search } from 'lucide-react'

interface HeaderProps {
  collapsed: boolean
  search: string
  onSearchChange: (value: string) => void
  onToggleCollapse: () => void
  onOpenMobile: () => void
}

export function Header({ collapsed, search, onSearchChange, onToggleCollapse, onOpenMobile }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
      <div className="flex items-center gap-3">
        <button
          aria-label="Ouvrir le menu"
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <button
          aria-label="Réduire la navigation"
          onClick={onToggleCollapse}
          className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:block"
        >
          {collapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
        </button>

        <div className="relative hidden w-64 sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          aria-label="Aide"
          className="hidden rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 sm:block"
        >
          <CircleHelp size={19} />
        </button>
        <button
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
        >
          <Bell size={19} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </button>
        <div className="hidden h-7 w-px bg-slate-200 sm:block" />
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
            AE
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-semibold">Anwar El Amrani</p>
            <p className="text-[11px] text-slate-400">Atlas Électroménager</p>
          </div>
          <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
        </div>
      </div>
    </header>
  )
}
