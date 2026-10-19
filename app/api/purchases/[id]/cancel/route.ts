import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-helpers'
import { handleAuthError } from '@/lib/auth-helpers'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier les permissions : OWNER, ADMIN, MANAGER
    const { store } = await requireRole(['OWNER', 'ADMIN', 'MANAGER'])

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
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error cancelling purchase:', error)
    return NextResponse.json(
      { error: 'Failed to cancel purchase' },
      { status: 500 }
    )
  }
}
