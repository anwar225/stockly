import { Archive, BarChart3, Boxes, ChevronLeft, ChevronRight, FileText, Gauge, LayoutGrid, Package, Settings, ShoppingCart, Tags, Truck, Users, X } from 'lucide-react'
import { Logo } from '@/components/shared/logo'

type View = 'dashboard' | 'products' | 'categories' | 'brands' | 'stock' | 'movements' | 'settings' | 'soon'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  view: View
  onNavigate: (view: View) => void
  onCloseMobile: () => void
}

const navGroups = [
  { label: 'Principal', items: [{ id: 'dashboard', label: 'Tableau de bord', icon: Gauge }] },
  {
    label: 'Catalogue',
    items: [
      { id: 'products', label: 'Produits', icon: Package },
      { id: 'categories', label: 'Catégories', icon: LayoutGrid },
      { id: 'brands', label: 'Marques', icon: Tags },
    ],
  },
  {
    label: 'Stock',
    items: [
      { id: 'stock', label: 'Stock', icon: Boxes },
      { id: 'movements', label: 'Mouvements de stock', icon: Archive },
    ],
  },
  { label: 'Achats', items: [{ id: 'soon', label: 'Fournisseurs', icon: Truck }, { id: 'soon', label: 'Achats', icon: ShoppingCart }] },
  {
    label: 'Ventes',
    items: [
      { id: 'soon', label: 'Clients', icon: Users },
      { id: 'soon', label: 'Ventes', icon: ShoppingCart },
      { id: 'soon', label: 'Factures', icon: FileText },
    ],
  },
  { label: 'Rapports', items: [{ id: 'soon', label: 'Analyses', icon: BarChart3 }] },
  {
    label: 'Administration',
    items: [{ id: 'soon', label: 'Équipe', icon: Users }, { id: 'settings', label: 'Paramètres', icon: Settings }],
  },
] as const

export function Sidebar({ collapsed, mobileOpen, view, onNavigate, onCloseMobile }: SidebarProps) {
  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 ${
          collapsed ? 'lg:w-[76px]' : ''
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-[74px] items-center border-b border-slate-100 px-5">
          <Logo collapsed={collapsed} />
          <button
            aria-label="Fermer le menu"
            onClick={onCloseMobile}
            className="ml-auto rounded-md p-1 text-slate-400 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p
                className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 ${
                  collapsed ? 'text-center' : ''
                }`}
              >
                {collapsed ? '•' : group.label}
              </p>
              {group.items.map((item, index) => {
                const Icon = item.icon
                return (
                  <button
                    key={`${item.label}-${index}`}
                    onClick={() => onNavigate(item.id as View)}
                    title={collapsed ? item.label : undefined}
                    className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                      view === item.id && item.id !== 'soon'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon size={17} strokeWidth={view === item.id ? 2.2 : 1.8} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className={`border-t border-slate-100 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => onNavigate('settings')}
            className={`flex items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-50 ${collapsed ? '' : 'w-full'}`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              AE
            </div>
            {!collapsed && (
              <div>
                <p className="text-xs font-semibold text-slate-800">Anwar El Amrani</p>
                <p className="text-[11px] text-slate-400">Super administrateur</p>
              </div>
            )}
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <button
          aria-label="Fermer la navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden"
        />
      )}
    </>
  )
}
