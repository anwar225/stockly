import type { Category, Brand, Product } from '@/types'
import type { StockStatus } from '@/types/stock.types'

// Products are now fetched from API - keeping types for reference
export const products = [] as any[]

// Categories and brands are now fetched from API - keeping types for reference
export const categories = [] as any[]
export const brands = [] as any[]

// Movements are now fetched from API - keeping types for reference
export const movements = [] as any[]

// Helper functions for other components that still use mock data
export const formatMad = (value: number) => `${value.toLocaleString('fr-FR')} MAD`

export const getStatus = (product: Product): StockStatus => {
  if (product.stock === 0) return 'Rupture'
  if (product.stock <= product.minStock) return 'Stock faible'
  return 'En stock'
}
