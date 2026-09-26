import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
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

    // Verify purchase exists and belongs to this store
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

    // Check status - only DRAFT and ORDERED can be cancelled
    if (purchase.status === 'RECEIVED') {
      return NextResponse.json(
        { error: 'Un achat déjà réceptionné ne peut pas être annulé' },
        { status: 409 }
      )
    }

    if (purchase.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cet achat est déjà annulé' },
        { status: 409 }
      )
    }

    // Cancel the purchase - does NOT modify stock or create StockMovement
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    // Serialize response
    const serializedPurchase = {
      id: updatedPurchase.id,
      reference: updatedPurchase.reference,
      supplierId: updatedPurchase.supplierId,
      storeId: updatedPurchase.storeId,
      purchaseDate: updatedPurchase.purchaseDate,
      status: updatedPurchase.status,
      totalAmount: Number(updatedPurchase.totalAmount),
      notes: updatedPurchase.notes,
      createdAt: updatedPurchase.createdAt,
      updatedAt: updatedPurchase.updatedAt,
    }

    return NextResponse.json(serializedPurchase)
  } catch (error) {
    console.error('Error cancelling purchase:', error)
    return NextResponse.json(
      { error: 'Failed to cancel purchase' },
      { status: 500 }
    )
  }
}
