export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK'

export type Payment = {
  id: string
  invoiceId: string
  storeId: string
  amount: number
  method: PaymentMethod
  paymentDate: string
  reference: string | null
  externalReference: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  invoice?: {
    id: string
    reference: string
    totalAmount: number
    status: string
    invoiceDate: string
    sale?: {
      id: string
      reference: string
      customer?: {
        id: string
        name: string
      }
    }
  }
}

export type PaymentListItem = {
  id: string
  invoiceId: string
  storeId: string
  amount: number
  method: PaymentMethod
  paymentDate: string
  reference: string | null
  externalReference: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  invoice?: {
    id: string
    reference: string
    totalAmount: number
    status: string
    invoiceDate: string
    sale?: {
      id: string
      reference: string
      customer?: {
        id: string
        name: string
      }
    }
  }
}

export type PaymentCreateInput = {
  invoiceId: string
  amount: number
  method: PaymentMethod
  paymentDate: string
  reference?: string
  externalReference?: string
  notes?: string
}
