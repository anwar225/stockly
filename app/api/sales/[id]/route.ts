import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the first available store
    const store = await prisma.store.findFirst()
    if (!store) {
      return NextResponse.json(
        { error: 'Aucun magasin disponible' },
        { status: 500 }
      )
    }

    // Find sale by id AND storeId (security check)
    const sale = await prisma.sale.findFirst({
      where: {
        id,
        storeId: store.id,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Vente introuvable' },
        { status: 404 }
      )
    }

    // Serialize Decimal to Number for JSON
    const serializedSale = {
      id: sale.id,
      reference: sale.reference,
      customerId: sale.customerId,
      storeId: sale.storeId,
      saleDate: sale.saleDate,
      status: sale.status,
      totalAmount: Number(sale.totalAmount),
      notes: sale.notes,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      customer: sale.customer,
      items: sale.items.map((item) => ({
        id: item.id,
        saleId: item.saleId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        createdAt: item.createdAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          stock: item.product.stock,
          sellingPrice: Number(item.product.sellingPrice),
        },
      })),
    }

    return NextResponse.json(serializedSale)
  } catch (error) {
    console.error('Error fetching sale:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sale' },
      { status: 500 }
    )
  }
}
