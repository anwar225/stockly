import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentStore } from '@/lib/get-current-store'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const store = await getCurrentStore()

    // Fetch payment with full details
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        storeId: store.id,
      },
      include: {
        invoice: {
          include: {
            sale: {
              include: {
                customer: true,
                items: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Paiement introuvable' },
        { status: 404 }
      )
    }

    // Serialize Decimal to Number for JSON
    const serializedPayment = {
      id: payment.id,
      invoiceId: payment.invoiceId,
      storeId: payment.storeId,
      amount: Number(payment.amount),
      method: payment.method,
      paymentDate: payment.paymentDate,
      reference: payment.reference,
      externalReference: payment.externalReference,
      notes: payment.notes,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      invoice: {
        id: payment.invoice.id,
        reference: payment.invoice.reference,
        totalAmount: Number(payment.invoice.totalAmount),
        status: payment.invoice.status,
        invoiceDate: payment.invoice.invoiceDate,
        sale: {
          id: payment.invoice.sale.id,
          reference: payment.invoice.sale.reference,
          customer: {
            id: payment.invoice.sale.customer.id,
            name: payment.invoice.sale.customer.name,
            phone: payment.invoice.sale.customer.phone,
            email: payment.invoice.sale.customer.email,
          },
          items: payment.invoice.sale.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
            },
          })),
        },
      },
    }

    return NextResponse.json(serializedPayment)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHENTICATED') {
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        )
      }
      if (error.message === 'NO_STORE_FOUND') {
        return NextResponse.json(
          { error: 'Aucun magasin disponible pour cette organisation' },
          { status: 500 }
        )
      }
    }
    console.error('Error fetching payment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    )
  }
}
