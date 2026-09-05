export type MovementType = 'Entrée' | 'Sortie' | 'Ajustement'

export type Movement = {
  id: string
  date: string
  product: string
  sku: string
  type: MovementType
  quantity: number
  reason: string
  user: string
}
