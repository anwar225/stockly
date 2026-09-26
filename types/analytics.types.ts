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

export interface PurchaseSummary {
  totalPurchases: number
  orderedPurchases: number
  receivedPurchases: number
  totalOrderedAmount: number
  totalReceivedAmount: number
  averageReceivedPurchaseAmount: number
}

export interface PurchaseTimelinePoint {
  date: string
  purchaseCount: number
  orderedCount: number
  receivedCount: number
  orderedAmount: number
  receivedAmount: number
}

export interface TopSupplier {
  supplierId: string
  supplierName: string
  purchaseCount: number
  orderedCount: number
  receivedCount: number
  totalOrderedAmount: number
  totalReceivedAmount: number
}

export interface PurchasedProduct {
  productId: string
  productName: string
  quantityOrdered: number
  quantityReceived: number
  totalOrderedAmount: number
  totalReceivedAmount: number
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

export interface PurchaseAnalytics {
  period: PeriodInfo
  summary: PurchaseSummary
  timeline: PurchaseTimelinePoint[]
  topSuppliers: TopSupplier[]
  purchasedProducts: PurchasedProduct[]
}

export type PeriodType = 'today' | '7d' | '30d' | 'month' | 'year' | 'custom'

export interface BusinessSales {
  revenue: number
  confirmedSales: number
  productsSold: number
  averageBasket: number
}

export interface BusinessPurchases {
  receivedAmount: number
  orderedAmount: number
  receivedPurchases: number
  orderedPurchases: number
}

export interface BusinessPayments {
  collectedAmount: number
  outstandingAmount: number
}

export interface BusinessStock {
  totalStock: number
  lowStock: number
  outOfStock: number
}

export interface BusinessActivity {
  customers: number
  suppliers: number
  products: number
}

export interface BusinessAnalytics {
  period: PeriodInfo
  sales: BusinessSales
  purchases: BusinessPurchases
  payments: BusinessPayments
  stock: BusinessStock
  activity: BusinessActivity
}

export interface ProductAnalyticsSummary {
  totalProducts: number
  activeProducts: number
  productsSold: number
  totalQuantitySold: number
  totalRevenue: number
  totalPurchasedQuantity: number
  totalReceivedPurchaseAmount: number
}

export interface ProductAnalyticsDetail {
  productId: string
  name: string
  sku: string
  category: {
    id: string | null
    name: string | null
  }
  brand: {
    id: string | null
    name: string | null
  }
  stock: number
  minStock: number
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  quantitySold: number
  revenue: number
  salesCount: number
  purchasedQuantity: number
  receivedPurchaseAmount: number
  lastSaleDate: string | null
  lastPurchaseDate: string | null
}

export interface ProductAnalytics {
  period: PeriodInfo
  summary: ProductAnalyticsSummary
  products: ProductAnalyticsDetail[]
  topProducts: ProductAnalyticsDetail[]
  lowStockProducts: ProductAnalyticsDetail[]
  outOfStockProducts: ProductAnalyticsDetail[]
  productsWithoutSales: ProductAnalyticsDetail[]
}

export interface CustomerAnalyticsSummary {
  totalCustomers: number
  activeCustomers: number
  customersWithSales: number
  totalRevenue: number
  totalSales: number
  averageCustomerRevenue: number
}

export interface CustomerAnalyticsDetail {
  customerId: string
  name: string
  phone: string | null
  email: string | null
  salesCount: number
  revenue: number
  productsBought: number
  averageOrderValue: number
  firstSaleDate: string | null
  lastSaleDate: string | null
}

export interface CustomerAnalytics {
  period: PeriodInfo
  summary: CustomerAnalyticsSummary
  topCustomers: CustomerAnalyticsDetail[]
  customersWithoutSales: CustomerAnalyticsDetail[]
  customers: CustomerAnalyticsDetail[]
}

export interface PaymentAnalyticsSummary {
  totalCollected: number
  paymentCount: number
  averagePayment: number
  cashAmount: number
  cardAmount: number
  bankTransferAmount: number
  checkAmount: number
  invoiceCount: number
  paidInvoices: number
  partiallyPaidInvoices: number
  unpaidInvoices: number
  outstandingAmount: number
}

export interface PaymentMethodAnalytics {
  method: string
  paymentCount: number
  amount: number
  percentage: number
}

export interface PaymentTimelinePoint {
  date: string
  paymentCount: number
  collectedAmount: number
}

export interface PaymentCustomerAnalytics {
  customerId: string
  name: string
  paymentCount: number
  collectedAmount: number
}

export interface RecentPayment {
  paymentId: string
  amount: number
  method: string
  paymentDate: string
  invoiceReference: string
  customerName: string
}

export interface PaymentAnalytics {
  period: PeriodInfo
  summary: PaymentAnalyticsSummary
  timeline: PaymentTimelinePoint[]
  methods: PaymentMethodAnalytics[]
  topCustomers: PaymentCustomerAnalytics[]
  recentPayments: RecentPayment[]
}
