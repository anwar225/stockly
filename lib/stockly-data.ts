import type { Product, Category, Brand, Movement, StockStatus } from '@/types'

export const products: Product[] = [
  { id: 'p1', name: 'Samsung WW90', sku: 'SAM-WW90', brand: 'Samsung', category: 'Lave-linge', purchasePrice: 4000, sellingPrice: 4799, stock: 2, minStock: 5, warranty: '24 mois' },
  { id: 'p2', name: 'LG TV 55"', sku: 'LG-TV55', brand: 'LG', category: 'Téléviseurs', purchasePrice: 5500, sellingPrice: 6499, stock: 0, minStock: 3, warranty: '24 mois' },
  { id: 'p3', name: 'Whirlpool W7', sku: 'WHI-W7', brand: 'Whirlpool', category: 'Réfrigérateurs', purchasePrice: 6200, sellingPrice: 7499, stock: 12, minStock: 4, warranty: '24 mois' },
  { id: 'p4', name: 'Hisense 65A6', sku: 'HIS-65A6', brand: 'Hisense', category: 'Téléviseurs', purchasePrice: 4800, sellingPrice: 5799, stock: 8, minStock: 3, warranty: '24 mois' },
  { id: 'p5', name: 'Bosch Serie 4', sku: 'BOS-S4', brand: 'Bosch', category: 'Lave-linge', purchasePrice: 3600, sellingPrice: 4299, stock: 3, minStock: 5, warranty: '24 mois' },
  { id: 'p6', name: 'TCL 55"', sku: 'TCL-55C', brand: 'TCL', category: 'Téléviseurs', purchasePrice: 3200, sellingPrice: 3899, stock: 16, minStock: 4, warranty: '12 mois' },
  { id: 'p7', name: 'Beko RCNE', sku: 'BEK-RCNE', brand: 'Beko', category: 'Réfrigérateurs', purchasePrice: 5100, sellingPrice: 6199, stock: 6, minStock: 3, warranty: '24 mois' },
  { id: 'p8', name: 'Haier HTR', sku: 'HAI-HTR', brand: 'Haier', category: 'Climatiseurs', purchasePrice: 2800, sellingPrice: 3399, stock: 10, minStock: 3, warranty: '12 mois' },
]

export const categories: Category[] = ['Réfrigérateurs', 'Lave-linge', 'Téléviseurs', 'Climatiseurs', 'Cuisinières', 'Fours', 'Micro-ondes', 'Lave-vaisselle', 'Petit électroménager'].map((name, i) => ({ id: `c${i}`, name, count: products.filter((p) => p.category === name).length, createdAt: '12 août 2026' }))

export const brands: Brand[] = ['Samsung', 'LG', 'Whirlpool', 'Bosch', 'Hisense', 'TCL', 'Beko', 'Haier'].map((name, i) => ({ id: `b${i}`, name, count: products.filter((p) => p.brand === name).length }))

export const movements: Movement[] = [
  { id: 'm1', date: '04/09/2026', product: 'Samsung WW90', sku: 'SAM-WW90', type: 'Ajustement', quantity: 5, reason: 'Inventaire', user: 'Anwar El Amrani' },
  { id: 'm2', date: '03/09/2026', product: 'LG TV 55"', sku: 'LG-TV55', type: 'Sortie', quantity: -2, reason: 'Vente', user: 'Anwar El Amrani' },
  { id: 'm3', date: '02/09/2026', product: 'Bosch Serie 4', sku: 'BOS-S4', type: 'Entrée', quantity: 10, reason: 'Réception fournisseur', user: 'Sara Benali' },
  { id: 'm4', date: '01/09/2026', product: 'Whirlpool W7', sku: 'WHI-W7', type: 'Entrée', quantity: 6, reason: 'Réception fournisseur', user: 'Anwar El Amrani' },
]

export const formatMad = (value: number) => `${value.toLocaleString('fr-FR')} MAD`

export const getStatus = (product: Product): StockStatus => {
  if (product.stock === 0) return 'Rupture'
  if (product.stock <= product.minStock) return 'Stock faible'
  return 'En stock'
}

export const chartData = [
  { name: 'Réfrigérateurs', value: 18 },
  { name: 'Lave-linge', value: 13 },
  { name: 'Téléviseurs', value: 24 },
  { name: 'Climatiseurs', value: 16 },
  { name: 'Cuisinières', value: 9 },
  { name: 'Petit électro.', value: 11 },
]
