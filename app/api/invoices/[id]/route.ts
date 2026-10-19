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

    // Fetch invoice with full details
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        storeId: store.id,
      },
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
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture introuvable' },
        { status: 404 }
      )
    }

    // Serialize Decimal to Number for JSON
    const serializedInvoice = {
      id: invoice.id,
      reference: invoice.reference,
      saleId: invoice.saleId,
      storeId: invoice.storeId,
      totalAmount: Number(invoice.totalAmount),
      status: invoice.status,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      sale: {
        id: invoice.sale.id,
        reference: invoice.sale.reference,
        saleDate: invoice.sale.saleDate,
        status: invoice.sale.status,
        totalAmount: Number(invoice.sale.totalAmount),
        customer: {
          id: invoice.sale.customer.id,
          name: invoice.sale.customer.name,
          phone: invoice.sale.customer.phone,
          email: invoice.sale.customer.email,
          address: invoice.sale.customer.address,
        },
        items: invoice.sale.items.map((item) => ({
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
    }

    return NextResponse.json(serializedInvoice)
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
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}
