// Type pour la création de mouvement (API)
export type MovementCreateInput = {
  productId: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  reason?: string
}

// Type pour la réponse de l'API Prisma
export type ApiMovement = {
  id: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  reason: string | null
  createdAt: string
  product: {
    id: string
    name: string
    sku: string
    stock: number
    category: string | null
    brand: string | null
  }
}

// Type pour la réponse de création de mouvement
export type MovementCreateResponse = {
  movement: {
    id: string
    type: 'IN' | 'OUT' | 'ADJUSTMENT'
    quantity: number
    reason: string | null
    createdAt: string
  }
  product: {
    id: string
    name: string
    sku: string
    stock: number
    minStock: number
    purchasePrice: number
    sellingPrice: number
    category: string | null
    brand: string | null
  }
}
