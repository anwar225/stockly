export type InvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID'

export type InvoiceItem = {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  total: number
  product: {
    id: string
    name: string
    sku: string
  }
}

export type InvoiceSale = {
  id: string
  reference: string
  saleDate: string
  status: string
  totalAmount: number
  customer: {
    id: string
    name: string
    phone: string | null
    email: string | null
    address: string | null
  }
  items?: InvoiceItem[]
}

export type Invoice = {
  id: string
  reference: string
  saleId: string
  storeId: string
  totalAmount: number
  status: InvoiceStatus
  invoiceDate: string
  dueDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  sale: InvoiceSale
}

export type InvoiceListItem = {
  id: string
  reference: string
  saleId: string
  storeId: string
  totalAmount: number
  status: InvoiceStatus
  invoiceDate: string
  dueDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  sale: {
    id: string
    reference: string
    saleDate: string
    customer: {
      id: string
      name: string
      phone: string | null
      email: string | null
    }
  }
}

export type InvoiceCreateInput = {
  saleId: string
  invoiceDate: string
  dueDate?: string
  notes?: string
}
