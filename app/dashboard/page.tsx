import { Suspense } from 'react'
import StocklyApp from '@/components/stockly-app'

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <StocklyApp />
    </Suspense>
  )
}
