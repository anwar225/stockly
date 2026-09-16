export type PurchaseStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'

export interface PurchaseItem {
  id: string
  purchaseId: string
  productId: string
  quantity: number
  unitPrice: number
  total: number
  createdAt: string
  product?: {
    id: string
    name: string
    sku: string
    stock: number
    category?: string | null
    brand?: string | null
  }
}

export interface Purchase {
  id: string
  reference: string
  supplierId: string
  storeId: string
  purchaseDate: string
  status: PurchaseStatus
  totalAmount: number
  notes: string | null
  createdAt: string
  updatedAt: string
  supplier?: {
    id: string
    name: string
    contactName: string | null
    phone: string | null
    email: string | null
    address: string | null
  }
  items?: PurchaseItem[]
}

export interface PurchaseFormData {
  supplierId: string
  purchaseDate: string
  notes?: string
  items: PurchaseItemFormData[]
}

export interface PurchaseItemFormData {
  productId: string
  quantity: number
  unitPrice: number
}
