export interface PeriodInfo {
  type: string
  startDate: string
  endDate: string
  granularity: 'day' | 'month'
}

export interface SalesSummary {
  count: number
  confirmedSalesCount: number
  cancelledCount: number
  draftCount: number
  revenue: number
  productsSold: number
  averageBasket: number
}

export interface TimelinePoint {
  date: string
  salesCount: number
  revenue: number
  productsSold: number
}

export interface TopProduct {
  productId: string
  productName: string
  categoryId: string | null
  categoryName: string | null
  quantitySold: number
  revenue: number
}

export interface CategoryAnalytics {
  categoryId: string
  categoryName: string
  quantitySold: number
  revenue: number
}

export interface TopCustomer {
  customerId: string
  customerName: string
  salesCount: number
  revenue: number
}

export interface InvoicesAnalytics {
  unpaid: number
  partiallyPaid: number
  paid: number
  outstanding: number
}

export interface StockAnalytics {
  total: number
  lowStock: number
  outOfStock: number
}

export interface PaymentsAnalytics {
  collectedAmount: number
}

export interface OverviewAnalytics {
  period: PeriodInfo
  sales: SalesSummary
  payments: PaymentsAnalytics
  invoices: InvoicesAnalytics
  stock: StockAnalytics
}

export interface SalesAnalytics {
  period: PeriodInfo
  summary: SalesSummary
  timeline: TimelinePoint[]
  topProducts: TopProduct[]
  categories: CategoryAnalytics[]
  topCustomers: TopCustomer[]
}

export type PeriodType = 'today' | '7d' | '30d' | 'month' | 'year' | 'custom'
