import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MoreHorizontal } from 'lucide-react'

interface StockChartProps {
  data: Array<{ name: string; value: number }>
}

export function StockChart({ data }: StockChartProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold">Répartition du stock</h2>
          <p className="mt-1 text-xs text-slate-400">Unités par catégorie</p>
        </div>
        <button className="rounded-lg border border-slate-200 p-2 text-slate-400">
          <MoreHorizontal size={17} />
        </button>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              interval={0}
              angle={-18}
              textAnchor="end"
              height={45}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#stockFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
