export type StockStatus = 'En stock' | 'Stock faible' | 'Rupture'

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
