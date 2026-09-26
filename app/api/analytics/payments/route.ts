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

    // Calculate payment analytics for the period
    const paymentData = await prisma.payment.aggregate({
      where: {
        storeId: store.id,
        paymentDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    const totalCollected = Number(paymentData._sum.amount || 0)
    const paymentCount = paymentData._count.id
    const averagePayment = paymentCount > 0 ? totalCollected / paymentCount : 0

    // Calculate payment methods breakdown
    const paymentMethodsData = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        storeId: store.id,
        paymentDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    const methods = paymentMethodsData.map((data) => ({
      method: data.method,
      paymentCount: data._count.id,
      amount: Number(data._sum.amount || 0),
      percentage: totalCollected > 0 ? (Number(data._sum.amount || 0) / totalCollected) * 100 : 0,
    }))

    // Ensure all methods are present (even with 0)
    const allMethods: Array<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK'> = ['CASH', 'CARD', 'BANK_TRANSFER', 'CHECK']
    const methodMap = new Map(methods.map((m) => [m.method, m]))
    const finalMethods = allMethods.map((method) => ({
      method,
      paymentCount: methodMap.get(method)?.paymentCount || 0,
      amount: methodMap.get(method)?.amount || 0,
      percentage: methodMap.get(method)?.percentage || 0,
    }))

    // Calculate current invoice status (not period-based)
    const invoiceCount = await prisma.invoice.count({
      where: {
        storeId: store.id,
      },
    })

    const paidInvoices = await prisma.invoice.count({
      where: {
        storeId: store.id,
        status: 'PAID',
      },
    })

    const partiallyPaidInvoices = await prisma.invoice.count({
      where: {
        storeId: store.id,
        status: 'PARTIALLY_PAID',
      },
    })

    const unpaidInvoices = await prisma.invoice.count({
      where: {
        storeId: store.id,
        status: 'UNPAID',
      },
    })

    // Calculate outstanding amount (current state, not period-based)
    const invoices = await prisma.invoice.findMany({
      where: {
        storeId: store.id,
        status: {
          in: ['UNPAID', 'PARTIALLY_PAID'],
        },
      },
      include: {
        payments: true,
      },
    })

    let outstandingAmount = 0
    for (const invoice of invoices) {
      const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      outstandingAmount += Number(invoice.totalAmount) - totalPaid
    }

    // Calculate timeline of collections
    let timeline: Array<{
      date: string
      paymentCount: number
      collectedAmount: number
    }> = []

    if (periodInfo.granularity === 'day') {
      const paymentsInPeriod = await prisma.payment.findMany({
        where: {
          storeId: store.id,
          paymentDate: {
            gte: periodInfo.startDate,
            lte: periodInfo.endDate,
          },
        },
        orderBy: {
          paymentDate: 'asc',
        },
      })

      const dateMap = new Map<string, { paymentCount: number; collectedAmount: number }>()
      for (const payment of paymentsInPeriod) {
        const dateStr = payment.paymentDate.toISOString().split('T')[0]
        const existing = dateMap.get(dateStr) || { paymentCount: 0, collectedAmount: 0 }
        dateMap.set(dateStr, {
          paymentCount: existing.paymentCount + 1,
          collectedAmount: existing.collectedAmount + Number(payment.amount),
        })
      }

      timeline = Array.from(dateMap.entries()).map(([date, data]) => ({
        date,
        paymentCount: data.paymentCount,
        collectedAmount: data.collectedAmount,
      }))
    } else {
      // Month granularity
      const paymentsInPeriod = await prisma.payment.findMany({
        where: {
          storeId: store.id,
          paymentDate: {
            gte: periodInfo.startDate,
            lte: periodInfo.endDate,
          },
        },
        orderBy: {
          paymentDate: 'asc',
        },
      })

      const monthMap = new Map<string, { paymentCount: number; collectedAmount: number }>()
      for (const payment of paymentsInPeriod) {
        const monthStr = payment.paymentDate.toISOString().slice(0, 7) // YYYY-MM
        const existing = monthMap.get(monthStr) || { paymentCount: 0, collectedAmount: 0 }
        monthMap.set(monthStr, {
          paymentCount: existing.paymentCount + 1,
          collectedAmount: existing.collectedAmount + Number(payment.amount),
        })
      }

      timeline = Array.from(monthMap.entries()).map(([date, data]) => ({
        date,
        paymentCount: data.paymentCount,
        collectedAmount: data.collectedAmount,
      }))
    }

    // Calculate top customers by collections
    const customerPaymentData = await prisma.payment.groupBy({
      by: ['invoiceId'],
      where: {
        storeId: store.id,
        paymentDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    const invoicePaymentMap = new Map(
      customerPaymentData.map((data) => [
        data.invoiceId,
        Number(data._sum.amount || 0),
      ])
    )

    // Get invoices with customer info
    const invoicesWithCustomers = await prisma.invoice.findMany({
      where: {
        storeId: store.id,
        id: {
          in: Array.from(invoicePaymentMap.keys()),
        },
      },
      include: {
        sale: {
          include: {
            customer: true,
          },
        },
      },
    })

    const customerPaymentMap = new Map<string, { paymentCount: number; collectedAmount: number }>()
    for (const invoice of invoicesWithCustomers) {
      const amount = invoicePaymentMap.get(invoice.id) || 0
      const customerId = invoice.sale.customerId

      const existing = customerPaymentMap.get(customerId) || { paymentCount: 0, collectedAmount: 0 }
      customerPaymentMap.set(customerId, {
        paymentCount: existing.paymentCount + 1,
        collectedAmount: existing.collectedAmount + amount,
      })
    }

    const topCustomers = Array.from(customerPaymentMap.entries())
      .map(([customerId, data]) => ({
        customerId,
        name: invoicesWithCustomers.find(i => i.sale.customerId === customerId)?.sale.customer.name || '',
        paymentCount: data.paymentCount,
        collectedAmount: data.collectedAmount,
      }))
      .sort((a, b) => {
        if (b.collectedAmount !== a.collectedAmount) {
          return b.collectedAmount - a.collectedAmount
        }
        if (b.paymentCount !== a.paymentCount) {
          return b.paymentCount - a.paymentCount
        }
        return a.name.localeCompare(b.name)
      })
      .slice(0, 10)

    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      where: {
        storeId: store.id,
        paymentDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      include: {
        invoice: {
          include: {
            sale: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
      orderBy: [
        { paymentDate: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10,
    })

    const recentPaymentsData = recentPayments.map((payment) => ({
      paymentId: payment.id,
      amount: Number(payment.amount),
      method: payment.method,
      paymentDate: payment.paymentDate.toISOString(),
      invoiceReference: payment.invoice.reference,
      customerName: payment.invoice.sale.customer.name,
    }))

    const response = {
      period: {
        type: periodInfo.type,
        startDate: periodInfo.startDate.toISOString(),
        endDate: periodInfo.endDate.toISOString(),
      },
      summary: {
        totalCollected,
        paymentCount,
        averagePayment,
        cashAmount: finalMethods.find((m) => m.method === 'CASH')?.amount || 0,
        cardAmount: finalMethods.find((m) => m.method === 'CARD')?.amount || 0,
        bankTransferAmount: finalMethods.find((m) => m.method === 'BANK_TRANSFER')?.amount || 0,
        checkAmount: finalMethods.find((m) => m.method === 'CHECK')?.amount || 0,
        invoiceCount,
        paidInvoices,
        partiallyPaidInvoices,
        unpaidInvoices,
        outstandingAmount,
      },
      timeline,
      methods: finalMethods,
      topCustomers,
      recentPayments: recentPaymentsData,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching payment analytics:', error)

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
      { error: 'Failed to fetch payment analytics' },
      { status: 500 }
    )
  }
}
