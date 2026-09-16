export interface Supplier {
  id: string
  name: string
  contactName: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  storeId: string
  createdAt: string
  updatedAt: string
}

export interface SupplierFormData {
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}
