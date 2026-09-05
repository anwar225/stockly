interface PageHeadingProps {
  title: string
  subtitle: string
  action?: React.ReactNode
}

export function PageHeading({ title, subtitle, action }: PageHeadingProps) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}
