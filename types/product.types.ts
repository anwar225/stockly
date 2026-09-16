export type Product = {
  id: string
  name: string
  sku: string
  brand: string
  category: string
  purchasePrice: number
  sellingPrice: number
  stock: number
  minStock: number
  warranty: string
  createdAt: string
}

export type ProductForm = {
  name: string
  sku: string
  brand: string
  category: string
  purchasePrice: number
  sellingPrice: number
  stock: number
  minStock: number
  warranty: string
}

// Type pour l'envoi à l'API
export type ProductCreateInput = {
  name: string
  sku: string
  description?: string
  purchasePrice: number
  sellingPrice: number
  stock: number
  minStock: number
  categoryId?: string
  brandId?: string
}

// Type pour la réponse de l'API Prisma
export type ApiProduct = {
  id: string
  name: string
  sku: string
  description: string | null
  purchasePrice: number
  sellingPrice: number
  stock: number
  minStock: number
  categoryId: string | null
  brandId: string | null
  storeId: string
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    storeId: string
    createdAt: string
    updatedAt: string
  } | null
  brand: {
    id: string
    name: string
    storeId: string
    createdAt: string
    updatedAt: string
  } | null
}
