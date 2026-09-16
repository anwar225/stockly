export interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  storeId: string
  createdAt: string
  updatedAt: string
}

export interface CustomerFormData {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}
