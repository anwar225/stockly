export type Category = {
  id: string
  name: string
  count: number
  createdAt: string
}

export type Brand = {
  id: string
  name: string
  count: number
}

// Type pour la réponse de l'API Prisma
export type ApiCategory = {
  id: string
  name: string
  storeId: string
  createdAt: string
  updatedAt: string
}

export type ApiBrand = {
  id: string
  name: string
  storeId: string
  createdAt: string
  updatedAt: string
}
