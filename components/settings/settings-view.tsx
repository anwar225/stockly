import { PageHeading } from '@/components/shared/page-heading'
import { SettingsCard } from './settings-card'

interface SettingsViewProps {
  onSave: () => void
}

export function SettingsView({ onSave }: SettingsViewProps) {
  return (
    <>
      <PageHeading
        title="Paramètres"
        subtitle="Gérez les informations de votre magasin et vos préférences."
        action={
          <button
            onClick={onSave}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600"
          >
            Enregistrer les modifications
          </button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <SettingsCard
            title="Informations du magasin"
            description="Ces informations apparaissent sur vos documents et votre espace de travail."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-700">Nom du magasin</span>
                <input
                  defaultValue="Atlas Électroménager"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
                />
              </label>
              {['Téléphone', 'Email', 'Adresse', 'Ville'].map((label) => (
                <label key={label} className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700">{label}</span>
                  <input
                    defaultValue={label === 'Ville' ? 'Casablanca' : ''}
                    placeholder={label}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
                  />
                </label>
              ))}
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Pays</span>
                <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  <option>Maroc</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Devise</span>
                <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  <option>MAD — Dirham marocain</option>
                </select>
              </label>
            </div>
          </SettingsCard>
          <SettingsCard title="Préférences" description="Personnalisez votre expérience Stockly.">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Langue</span>
                <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  <option>Français</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Fuseau horaire</span>
                <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  <option>Africa/Casablanca</option>
                </select>
              </label>
            </div>
          </SettingsCard>
        </div>
        <div className="space-y-6">
          <SettingsCard title="Sécurité" description="Gérez la sécurité de votre compte.">
            <div className="space-y-4">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Mot de passe actuel</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Nouveau mot de passe</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Confirmer le mot de passe</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
                />
              </label>
            </div>
          </SettingsCard>
          <SettingsCard title="Notifications" description="Configurez vos préférences de notification.">
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="rounded border-slate-300" defaultChecked />
                <span className="text-sm text-slate-700">Alertes de stock faible</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="rounded border-slate-300" defaultChecked />
                <span className="text-sm text-slate-700">Rapports quotidiens</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="rounded border-slate-300" />
                <span className="text-sm text-slate-700">Notifications par email</span>
              </label>
            </div>
          </SettingsCard>
        </div>
      </div>
    </>
  )
}
