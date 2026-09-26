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

    // Calculate summary KPIs
    const totalPurchases = await prisma.purchase.count({
      where: {
        storeId: store.id,
        status: {
          in: ['ORDERED', 'RECEIVED'],
        },
        purchaseDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
    })

    const orderedPurchases = await prisma.purchase.count({
      where: {
        storeId: store.id,
        status: 'ORDERED',
        purchaseDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
    })

    const receivedPurchases = await prisma.purchase.count({
      where: {
        storeId: store.id,
        status: 'RECEIVED',
        purchaseDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
    })

    const orderedAmountResult = await prisma.purchase.aggregate({
      where: {
        storeId: store.id,
        status: 'ORDERED',
        purchaseDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    })

    const totalOrderedAmount = Number(orderedAmountResult._sum.totalAmount || 0)

    const receivedAmountResult = await prisma.purchase.aggregate({
      where: {
        storeId: store.id,
        status: 'RECEIVED',
        purchaseDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    })

    const totalReceivedAmount = Number(receivedAmountResult._sum.totalAmount || 0)

    const averageReceivedPurchaseAmount = receivedPurchases > 0 ? totalReceivedAmount / receivedPurchases : 0

    // Calculate timeline data
    let timeline: Array<{
      date: string
      purchaseCount: number
      orderedCount: number
      receivedCount: number
      orderedAmount: number
      receivedAmount: number
    }> = []

    if (periodInfo.granularity === 'day') {
      // Group by day using Prisma queries
      const purchasesInPeriod = await prisma.purchase.findMany({
        where: {
          storeId: store.id,
          purchaseDate: {
            gte: periodInfo.startDate,
            lte: periodInfo.endDate,
          },
        },
        include: {
          items: true,
        },
      })

      // Group by date
      const dateMap = new Map<string, { purchaseCount: number; orderedCount: number; receivedCount: number; orderedAmount: number; receivedAmount: number }>()
      for (const purchase of purchasesInPeriod) {
        // Only count ORDERED and RECEIVED
        if (purchase.status === 'DRAFT' || purchase.status === 'CANCELLED') {
          continue
        }

        const dateStr = purchase.purchaseDate.toISOString().split('T')[0]
        const existing = dateMap.get(dateStr) || { purchaseCount: 0, orderedCount: 0, receivedCount: 0, orderedAmount: 0, receivedAmount: 0 }

        if (purchase.status === 'ORDERED') {
          dateMap.set(dateStr, {
            purchaseCount: existing.purchaseCount + 1,
            orderedCount: existing.orderedCount + 1,
            receivedCount: existing.receivedCount,
            orderedAmount: existing.orderedAmount + Number(purchase.totalAmount),
            receivedAmount: existing.receivedAmount,
          })
        } else if (purchase.status === 'RECEIVED') {
          dateMap.set(dateStr, {
            purchaseCount: existing.purchaseCount + 1,
            orderedCount: existing.orderedCount,
            receivedCount: existing.receivedCount + 1,
            orderedAmount: existing.orderedAmount,
            receivedAmount: existing.receivedAmount + Number(purchase.totalAmount),
          })
        }
      }

      // Fill missing days with zeros
      const currentDate = new Date(periodInfo.startDate)
      const endDate = new Date(periodInfo.endDate)
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const data = dateMap.get(dateStr) || { purchaseCount: 0, orderedCount: 0, receivedCount: 0, orderedAmount: 0, receivedAmount: 0 }
        timeline.push({
          date: dateStr,
          ...data,
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else {
      // Group by month using Prisma queries
      const purchasesInPeriod = await prisma.purchase.findMany({
        where: {
          storeId: store.id,
          purchaseDate: {
            gte: periodInfo.startDate,
            lte: periodInfo.endDate,
          },
        },
        include: {
          items: true,
        },
      })

      // Group by month
      const monthMap = new Map<string, { purchaseCount: number; orderedCount: number; receivedCount: number; orderedAmount: number; receivedAmount: number }>()
      for (const purchase of purchasesInPeriod) {
        // Only count ORDERED and RECEIVED
        if (purchase.status === 'DRAFT' || purchase.status === 'CANCELLED') {
          continue
        }

        const monthStr = purchase.purchaseDate.toISOString().substring(0, 7) // YYYY-MM
        const existing = monthMap.get(monthStr) || { purchaseCount: 0, orderedCount: 0, receivedCount: 0, orderedAmount: 0, receivedAmount: 0 }

        if (purchase.status === 'ORDERED') {
          monthMap.set(monthStr, {
            purchaseCount: existing.purchaseCount + 1,
            orderedCount: existing.orderedCount + 1,
            receivedCount: existing.receivedCount,
            orderedAmount: existing.orderedAmount + Number(purchase.totalAmount),
            receivedAmount: existing.receivedAmount,
          })
        } else if (purchase.status === 'RECEIVED') {
          monthMap.set(monthStr, {
            purchaseCount: existing.purchaseCount + 1,
            orderedCount: existing.orderedCount,
            receivedCount: existing.receivedCount + 1,
            orderedAmount: existing.orderedAmount,
            receivedAmount: existing.receivedAmount + Number(purchase.totalAmount),
          })
        }
      }

      timeline = Array.from(monthMap.entries())
        .map(([date, data]) => ({
          date: date + '-01',
          ...data,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    // Calculate top suppliers
    const supplierPurchases = await prisma.purchase.groupBy({
      by: ['supplierId'],
      where: {
        storeId: store.id,
        purchaseDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
        status: {
          in: ['ORDERED', 'RECEIVED'],
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc',
        },
      },
    })

    const supplierIds = supplierPurchases.map((p) => p.supplierId)
    const suppliers = await prisma.supplier.findMany({
      where: {
        id: { in: supplierIds },
        storeId: store.id,
      },
    })

    const supplierMap = new Map(suppliers.map((s) => [s.id, s]))

    // Get detailed stats for each supplier
    const topSuppliers = []
    for (const supplierPurchase of supplierPurchases) {
      const supplier = supplierMap.get(supplierPurchase.supplierId)
      if (!supplier) continue

      const ordered = await prisma.purchase.aggregate({
        where: {
          supplierId: supplier.id,
          storeId: store.id,
          status: 'ORDERED',
          purchaseDate: {
            gte: periodInfo.startDate,
            lte: periodInfo.endDate,
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          totalAmount: true,
        },
      })

      const received = await prisma.purchase.aggregate({
        where: {
          supplierId: supplier.id,
          storeId: store.id,
          status: 'RECEIVED',
          purchaseDate: {
            gte: periodInfo.startDate,
            lte: periodInfo.endDate,
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          totalAmount: true,
        },
      })

      topSuppliers.push({
        supplierId: supplier.id,
        supplierName: supplier.name,
        purchaseCount: supplierPurchase._count.id,
        orderedCount: ordered._count.id,
        receivedCount: received._count.id,
        totalOrderedAmount: Number(ordered._sum.totalAmount || 0),
        totalReceivedAmount: Number(received._sum.totalAmount || 0),
      })
    }

    // Sort by totalReceivedAmount DESC, then purchaseCount DESC
    topSuppliers.sort((a, b) => {
      if (b.totalReceivedAmount !== a.totalReceivedAmount) {
        return b.totalReceivedAmount - a.totalReceivedAmount
      }
      return b.purchaseCount - a.purchaseCount
    })

    // Calculate top purchased products
    const productPurchases = await prisma.purchaseItem.groupBy({
      by: ['productId'],
      where: {
        purchase: {
          storeId: store.id,
          purchaseDate: {
            gte: periodInfo.startDate,
            lte: periodInfo.endDate,
          },
          status: {
            in: ['ORDERED', 'RECEIVED'],
          },
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
    })

    const productIds = productPurchases.map((p) => p.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        storeId: store.id,
      },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    // Get detailed stats for each product
    const purchasedProducts = []
    for (const productPurchase of productPurchases) {
      const product = productMap.get(productPurchase.productId)
      if (!product) continue

      const ordered = await prisma.purchaseItem.aggregate({
        where: {
          productId: product.id,
          purchase: {
            storeId: store.id,
            status: 'ORDERED',
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

      const received = await prisma.purchaseItem.aggregate({
        where: {
          productId: product.id,
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

      purchasedProducts.push({
        productId: product.id,
        productName: product.name,
        quantityOrdered: ordered._sum.quantity || 0,
        quantityReceived: received._sum.quantity || 0,
        totalOrderedAmount: Number(ordered._sum.total || 0),
        totalReceivedAmount: Number(received._sum.total || 0),
      })
    }

    const response = {
      period: {
        type: periodInfo.type,
        startDate: periodInfo.startDate.toISOString(),
        endDate: periodInfo.endDate.toISOString(),
        granularity: periodInfo.granularity,
      },
      summary: {
        totalPurchases,
        orderedPurchases,
        receivedPurchases,
        totalOrderedAmount,
        totalReceivedAmount,
        averageReceivedPurchaseAmount,
      },
      timeline,
      topSuppliers,
      purchasedProducts,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching purchase analytics:', error)

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
      { error: 'Failed to fetch purchase analytics' },
      { status: 500 }
    )
  }
}
