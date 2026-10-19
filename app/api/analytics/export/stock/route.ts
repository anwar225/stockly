import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { csvResponse, escapeCsv } from '@/lib/csv'
import { requireRole } from '@/lib/auth-helpers'
import { handleAuthError } from '@/lib/auth-helpers'

export async function GET(request: Request) {
  try {
    // Vérifier les permissions : OWNER, ADMIN, MANAGER
    const { store } = await requireRole(['OWNER', 'ADMIN', 'MANAGER'])

    // Fetch all products for the store with current stock
    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        category: true,
        brand: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Build CSV rows
    const rows = products.map((product) => [
      escapeCsv(product.name),
      escapeCsv(product.sku),
      escapeCsv(product.category?.name || ''),
      escapeCsv(product.brand?.name || ''),
      Number(product.purchasePrice),
      Number(product.sellingPrice),
      product.stock,
      product.minStock,
    ])

    const headers = [
      'Nom',
      'SKU',
      'Catégorie',
      'Marque',
      'Prix d\'achat',
      'Prix de vente',
      'Stock',
      'Stock minimum',
    ]

    const csv = [headers, ...rows].map((row) => row.join(';')).join('\n')

    // Generate filename based on period
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const filename = `stockly-stock-${year}-${month}.csv`

    return csvResponse(csv, filename)
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error exporting stock:', error)

    return NextResponse.json(
      { error: 'Failed to export stock' },
      { status: 500 }
    )
  }
}
