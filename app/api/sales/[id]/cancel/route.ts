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
    
    // Verify sale exists and belongs to this store
    const sale = await prisma.sale.findFirst({
      where: {
        id,
        storeId: store.id,
      },
    })
    
    if (!sale) {
      return NextResponse.json(
        { error: 'Vente introuvable' },
        { status: 404 }
      )
    }
    
    // Check status - only DRAFT can be cancelled in MVP4
    if (sale.status === 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Une vente confirmée ne peut pas être annulée' },
        { status: 409 }
      )
    }
    
    if (sale.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cette vente est déjà annulée' },
        { status: 409 }
      )
    }
    
    // Cancel the sale - does NOT modify stock or create StockMovement
    const updatedSale = await prisma.sale.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })
    
    // Serialize response
    const serializedSale = {
      id: updatedSale.id,
      reference: updatedSale.reference,
      customerId: updatedSale.customerId,
      storeId: updatedSale.storeId,
      saleDate: updatedSale.saleDate,
      status: updatedSale.status,
      totalAmount: Number(updatedSale.totalAmount),
      notes: updatedSale.notes,
      createdAt: updatedSale.createdAt,
      updatedAt: updatedSale.updatedAt,
    }
    
    return NextResponse.json(serializedSale)
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error cancelling sale:', error)
    return NextResponse.json(
      { error: 'Failed to cancel sale' },
      { status: 500 }
    )
  }
}
