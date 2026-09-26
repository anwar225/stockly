import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { csvResponse, escapeCsv } from '@/lib/csv'

export async function GET(request: Request) {
  try {
    // Get the first available store
    const store = await prisma.store.findFirst()
    if (!store) {
      return NextResponse.json(
        { error: 'Aucun magasin disponible' },
        { status: 500 }
      )
    }

    // Fetch all products for the store with current stock
    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        category: true,
        brand: true,
      },
    })

    // Calculate stock value for each product
    const rows = products.map((product) => {
      const stockValue = product.stock * Number(product.purchasePrice)

      // Stock status
      let stockStatus = 'En stock'
      if (product.stock === 0) {
        stockStatus = 'Rupture de stock'
      } else if (product.stock <= product.minStock) {
        stockStatus = 'Stock faible'
      }

      return [
        escapeCsv(product.name),
        escapeCsv(product.sku || ''),
        escapeCsv(product.category?.name || ''),
        escapeCsv(product.brand?.name || ''),
        product.stock,
        product.minStock,
        stockStatus,
        Number(product.purchasePrice),
        stockValue,
      ]
    })

    const headers = [
      'Produit',
      'SKU',
      'Catégorie',
      'Marque',
      'Stock actuel',
      'Stock minimum',
      'Statut',
      'Prix achat actuel',
      'Valeur actuelle du stock au coût d\'achat actuel',
    ]

    const csv = [headers, ...rows].map((row) => row.join(';')).join('\n')

    // Generate filename with current date
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const filename = `stockly-stock-${year}-${month}-${day}.csv`

    return csvResponse(csv, filename)
  } catch (error) {
    console.error('Error exporting stock:', error)
    return NextResponse.json(
      { error: 'Failed to export stock' },
      { status: 500 }
    )
  }
}
