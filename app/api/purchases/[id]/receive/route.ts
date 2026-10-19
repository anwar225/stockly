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
    
    // Receive purchase in a single transaction with atomic status transition
    const result = await prisma.$transaction(async (tx) => {
      // Find purchase by id AND storeId WITHIN transaction
      const purchase = await tx.purchase.findFirst({
        where: {
          id,
          storeId: store.id,
        },
        include: {
          items: true,
        },
      })

      if (!purchase) {
        throw new Error('Purchase not found')
      }

      // Check if purchase can be received (must be ORDERED) WITHIN transaction
      if (purchase.status !== 'ORDERED') {
        throw new Error('Purchase cannot be received. Current status: ' + purchase.status)
      }

      // Create stock movements and update product stock for each item
      for (const item of purchase.items) {
        // Verify product belongs to this store before updating
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            storeId: store.id,
          },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })

        // If no rows were affected, product doesn't belong to this store
        if (updateResult.count === 0) {
          throw new Error('Product does not belong to this store')
        }

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            type: 'IN',
            quantity: item.quantity,
            reason: `Réception achat #${purchase.reference}`,
            productId: item.productId,
            storeId: store.id,
          },
        })
      }

      // Update purchase status to RECEIVED WITHIN transaction
      const updatedPurchase = await tx.purchase.update({
        where: { id },
        data: {
          status: 'RECEIVED',
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

      return updatedPurchase
    })
    
    // Serialize response
    const serializedResponse = {
      id: result.id,
      reference: result.reference,
      supplierId: result.supplierId,
      storeId: result.storeId,
      purchaseDate: result.purchaseDate,
      status: result.status,
      totalAmount: Number(result.totalAmount),
      notes: result.notes,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      supplier: result.supplier,
      items: result.items.map((item) => ({
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
    
    return NextResponse.json(serializedResponse)
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error receiving purchase:', error)

    // Handle specific transaction errors
    if (error instanceof Error) {
      if (error.message === 'Purchase not found') {
        return NextResponse.json(
          { error: 'Achat introuvable' },
          { status: 404 }
        )
      }

      if (error.message.startsWith('Purchase cannot be received')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      if (error.message === 'Product does not belong to this store') {
        return NextResponse.json(
          { error: 'Un produit n\'appartient pas à ce magasin' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to receive purchase' },
      { status: 500 }
    )
  }
}
