import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPeriodInfo } from '@/lib/analytics-helper'

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

    // Get all products for this store
    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        category: true,
        brand: true,
      },
    })

    const totalProducts = products.length
    const activeProducts = products.filter((p) => p.stock > 0).length

    // Calculate sales analytics (CONFIRMED only)
    const salesData = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          storeId: store.id,
          status: 'CONFIRMED',
          saleDate: {
            gte: periodInfo.startDate,
            lte: periodInfo.endDate,
          },
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      _count: {
        saleId: true,
      },
    })

    const salesMap = new Map(
      salesData.map((data) => [
        data.productId,
        {
          quantitySold: data._sum.quantity || 0,
          revenue: Number(data._sum.total || 0),
          salesCount: data._count.saleId,
        },
      ])
    )

    // Calculate purchases analytics (RECEIVED only)
    const purchasesData = await prisma.purchaseItem.groupBy({
      by: ['productId'],
      where: {
        purchase: {
          storeId: store.id,
          status: 'RECEIVED',
          purchaseDate: {
            gte: periodInfo.startDate,
            lte: periodInfo.endDate,
          },
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
    })

    const purchasesMap = new Map(
      purchasesData.map((data) => [
        data.productId,
        {
          purchasedQuantity: data._sum.quantity || 0,
          receivedPurchaseAmount: Number(data._sum.total || 0),
        },
      ])
    )

    // Get last sale date for each product
    const lastSaleDates = await prisma.saleItem.findMany({
      where: {
        sale: {
          storeId: store.id,
          status: 'CONFIRMED',
        },
      },
      orderBy: {
        sale: {
          saleDate: 'desc',
        },
      },
      select: {
        productId: true,
        sale: {
          select: {
            saleDate: true,
          },
        },
      },
    })

    const lastSaleDateMap = new Map<string, Date>()
    for (const item of lastSaleDates) {
      if (!lastSaleDateMap.has(item.productId)) {
        lastSaleDateMap.set(item.productId, item.sale.saleDate)
      }
    }

    // Get last purchase date for each product
    const lastPurchaseDates = await prisma.purchaseItem.findMany({
      where: {
        purchase: {
          storeId: store.id,
          status: 'RECEIVED',
        },
      },
      orderBy: {
        purchase: {
          purchaseDate: 'desc',
        },
      },
      select: {
        productId: true,
        purchase: {
          select: {
            purchaseDate: true,
          },
        },
      },
    })

    const lastPurchaseDateMap = new Map<string, Date>()
    for (const item of lastPurchaseDates) {
      if (!lastPurchaseDateMap.has(item.productId)) {
        lastPurchaseDateMap.set(item.productId, item.purchase.purchaseDate)
      }
    }

    // Build product analytics details
    const productDetails: any[] = []

    let totalQuantitySold = 0
    let totalRevenue = 0
    let totalPurchasedQuantity = 0
    let totalReceivedPurchaseAmount = 0
    let productsSold = 0

    for (const product of products) {
      const sales = salesMap.get(product.id) || { quantitySold: 0, revenue: 0, salesCount: 0 }
      const purchases = purchasesMap.get(product.id) || { purchasedQuantity: 0, receivedPurchaseAmount: 0 }

      const lastSaleDate = lastSaleDateMap.get(product.id) || null
      const lastPurchaseDate = lastPurchaseDateMap.get(product.id) || null

      // Calculate stock status
      let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
      if (product.stock === 0) {
        stockStatus = 'OUT_OF_STOCK'
      } else if (product.stock <= product.minStock) {
        stockStatus = 'LOW_STOCK'
      } else {
        stockStatus = 'IN_STOCK'
      }

      if (sales.quantitySold > 0) {
        productsSold++
      }

      totalQuantitySold += sales.quantitySold
      totalRevenue += sales.revenue
      totalPurchasedQuantity += purchases.purchasedQuantity
      totalReceivedPurchaseAmount += purchases.receivedPurchaseAmount

      productDetails.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        category: {
          id: product.categoryId,
          name: product.category?.name || null,
        },
        brand: {
          id: product.brandId,
          name: product.brand?.name || null,
        },
        stock: product.stock,
        minStock: product.minStock,
        stockStatus,
        quantitySold: sales.quantitySold,
        revenue: sales.revenue,
        salesCount: sales.salesCount,
        purchasedQuantity: purchases.purchasedQuantity,
        receivedPurchaseAmount: purchases.receivedPurchaseAmount,
        lastSaleDate: lastSaleDate ? lastSaleDate.toISOString() : null,
        lastPurchaseDate: lastPurchaseDate ? lastPurchaseDate.toISOString() : null,
      })
    }

    // Top products (by revenue DESC, then quantitySold DESC) - only products with sales
    const topProducts = [...productDetails]
      .filter((p) => p.quantitySold > 0)
      .sort((a, b) => {
        if (b.revenue !== a.revenue) {
          return b.revenue - a.revenue
        }
        return b.quantitySold - a.quantitySold
      })
      .slice(0, 10)

    // Low stock products
    const lowStockProducts = productDetails
      .filter((p) => p.stockStatus === 'LOW_STOCK')
      .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name))

    // Out of stock products
    const outOfStockProducts = productDetails
      .filter((p) => p.stockStatus === 'OUT_OF_STOCK')
      .sort((a, b) => a.name.localeCompare(b.name))

    // Products without sales in period
    const productsWithoutSales = productDetails
      .filter((p) => p.quantitySold === 0)
      .sort((a, b) => a.name.localeCompare(b.name))

    const response = {
      period: {
        type: periodInfo.type,
        startDate: periodInfo.startDate.toISOString(),
        endDate: periodInfo.endDate.toISOString(),
      },
      summary: {
        totalProducts,
        activeProducts,
        productsSold,
        totalQuantitySold,
        totalRevenue,
        totalPurchasedQuantity,
        totalReceivedPurchaseAmount,
      },
      products: productDetails,
      topProducts,
      lowStockProducts,
      outOfStockProducts,
      productsWithoutSales,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching product analytics:', error)

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
      { error: 'Failed to fetch product analytics' },
      { status: 500 }
    )
  }
}
