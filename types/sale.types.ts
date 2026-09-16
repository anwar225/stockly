export type SaleStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

export interface SaleItem {
  id: string
  saleId: string
  productId: string
  quantity: number
  unitPrice: number
  total: number
  createdAt: string
  product: {
    id: string
    name: string
    sku: string
    stock: number
    sellingPrice: number
  }
}

export interface Sale {
  id: string
  reference: string
  customerId: string
  storeId: string
  saleDate: string
  status: SaleStatus
  totalAmount: number
  notes: string | null
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    name: string
    phone: string | null
    email: string | null
  }
  items: SaleItem[]
}

export interface SaleListItem {
  id: string
  reference: string
  customerName: string
  saleDate: string
  status: SaleStatus
  totalAmount: number
  itemsCount: number
}

export interface SaleCreateItem {
  productId: string
  quantity: number
}

export interface SaleCreateInput {
  customerId: string
  saleDate: string
  notes?: string
  items: SaleCreateItem[]
}
