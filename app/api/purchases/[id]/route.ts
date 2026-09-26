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

    // Find purchase by id AND storeId (security check)
    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        storeId: store.id,
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
                brand: true,
              },
            },
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Achat introuvable' },
        { status: 404 }
      )
    }

    // Serialize Decimal to Number
    const serializedPurchase = {
      id: purchase.id,
      reference: purchase.reference,
      supplierId: purchase.supplierId,
      storeId: purchase.storeId,
      purchaseDate: purchase.purchaseDate,
      status: purchase.status,
      totalAmount: Number(purchase.totalAmount),
      notes: purchase.notes,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
      supplier: purchase.supplier,
      items: purchase.items.map((item) => ({
        id: item.id,
        purchaseId: item.purchaseId,
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
          category: item.product.category?.name || null,
          brand: item.product.brand?.name || null,
        },
      })),
    }

    return NextResponse.json(serializedPurchase)
  } catch (error) {
    console.error('Error fetching purchase:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Find purchase by id AND storeId
    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        storeId: store.id,
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Achat introuvable' },
        { status: 404 }
      )
    }

    // Only allow deletion of DRAFT purchases
    if (purchase.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Seuls les achats en brouillon peuvent être supprimés' },
        { status: 400 }
      )
    }

    // Delete purchase and items in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete items first (cascade would work but explicit is clearer)
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: id },
      })

      // Delete purchase
      await tx.purchase.delete({
        where: { id },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting purchase:', error)
    return NextResponse.json(
      { error: 'Failed to delete purchase' },
      { status: 500 }
    )
  }
}

