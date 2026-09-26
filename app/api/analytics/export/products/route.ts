import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPeriodInfo } from '@/lib/analytics-helper'
import { csvResponse, escapeCsv } from '@/lib/csv'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get period info
    const periodInfo = getPeriodInfo(period || undefined, startDate || undefined, endDate || undefined)

    // Get the first available store
    const store = await prisma.store.findFirst()
    if (!store) {
      return NextResponse.json(
        { error: 'Aucun magasin disponible' },
        { status: 500 }
      )
    }

    // Fetch all products for the store
    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        category: true,
        brand: true,
        saleItems: {
          where: {
            sale: {
              status: 'CONFIRMED',
              saleDate: {
                gte: periodInfo.startDate,
                lte: periodInfo.endDate,
              },
            },
          },
        },
        purchaseItems: {
          where: {
            purchase: {
              status: 'RECEIVED',
              purchaseDate: {
                gte: periodInfo.startDate,
                lte: periodInfo.endDate,
              },
            },
          },
        },
      },
    })

    // Calculate metrics for each product
    const rows = products.map((product) => {
      const quantitySold = product.saleItems.reduce((sum, item) => sum + item.quantity, 0)
      const revenue = product.saleItems.reduce((sum, item) => sum + Number(item.total), 0)
      const quantityPurchased = product.purchaseItems.reduce((sum, item) => sum + item.quantity, 0)
      const purchaseAmount = product.purchaseItems.reduce((sum, item) => sum + Number(item.total), 0)

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
        quantitySold,
        revenue,
        quantityPurchased,
        purchaseAmount,
      ]
    })

    const headers = [
      'Produit',
      'SKU',
      'Catégorie',
      'Marque',
      'Stock',
      'Stock minimum',
      'Statut stock',
      'Quantité vendue',
      'CA ventes',
      'Quantité achetée',
      'Montant achats reçus',
    ]

    const csv = [headers, ...rows].map((row) => row.join(';')).join('\n')

    // Generate filename based on period
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const filename = `stockly-produits-${year}-${month}.csv`

    return csvResponse(csv, filename)
  } catch (error) {
    console.error('Error exporting products:', error)

    if (error instanceof Error) {
      if (error.message === 'Dates invalides') {
        return NextResponse.json(
          { error: 'Dates invalides' },
          { status: 400 }
        )
      }

      if (error.message === 'La date de début doit être antérieure à la date de fin') {
        return NextResponse.json(
          { error: 'La date de début doit être antérieure à la date de fin' },
          { status: 400 }
        )
      }

      if (error.message === 'Les paramètres startDate et endDate doivent être fournis ensemble') {
        return NextResponse.json(
          { error: 'Les paramètres startDate et endDate doivent être fournis ensemble' },
          { status: 400 }
        )
      }

      if (error.message === 'Période invalide') {
        return NextResponse.json(
          { error: 'Période invalide' },
          { status: 400 }
        )
      }

      if (error.message === 'Ne pouvez pas spécifier à la fois une période et des dates personnalisées') {
        return NextResponse.json(
          { error: 'Ne pouvez pas spécifier à la fois une période et des dates personnalisées' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to export products' },
      { status: 500 }
    )
  }
}
