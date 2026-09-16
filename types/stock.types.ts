// Stock-related types
export type StockStatus = 'En stock' | 'Stock faible' | 'Rupture'

export type StockProduct = {
  id: string
  name: string
  sku: string
  stock: number
  minStock: number
  sellingPrice: number
  category: string | null
  brand: string | null
}

// Type pour la réponse de l'API Prisma
export type ApiStockProduct = {
  id: string
  name: string
  sku: string
  stock: number
  minStock: number
  sellingPrice: number
  category: string | null
  brand: string | null
}
