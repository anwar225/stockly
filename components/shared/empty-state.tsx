import { Zap } from 'lucide-react'

export function EmptySoon() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <Zap size={25} />
      </div>
      <h2 className="font-display text-xl font-bold text-slate-900">Bientôt disponible</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Ce module arrive dans une prochaine version de Stockly. Nous construisons une expérience simple et fiable pour votre magasin.
      </p>
    </div>
  )
}
