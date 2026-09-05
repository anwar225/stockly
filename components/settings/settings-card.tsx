interface SettingsCardProps {
  title: string
  description: string
  children: React.ReactNode
}

export function SettingsCard({ title, description, children }: SettingsCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <p className="mt-1 mb-5 text-xs leading-5 text-slate-400">{description}</p>
      {children}
    </section>
  )
}
