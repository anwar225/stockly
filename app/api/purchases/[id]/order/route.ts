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
    
    // Check if purchase can be ordered (must be DRAFT)
    if (purchase.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Cet achat ne peut pas être commandé. Statut actuel: ' + purchase.status },
        { status: 400 }
      )
    }
    
    // Update purchase status to ORDERED
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: {
        status: 'ORDERED',
      },
    })
    
    return NextResponse.json(updatedPurchase)
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error ordering purchase:', error)
    return NextResponse.json(
      { error: 'Failed to order purchase' },
      { status: 500 }
    )
  }
}
