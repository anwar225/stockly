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

    // Vérifier les permissions : OWNER, ADMIN, MANAGER, EMPLOYEE
    const { store } = await requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'])
    
    // Verify sale exists and belongs to this store
    const sale = await prisma.sale.findFirst({
      where: {
        id,
        storeId: store.id,
      },
      include: {
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
    
    // Check status - only DRAFT can be confirmed
    if (sale.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Seule une vente en brouillon peut être confirmée' },
        { status: 409 }
      )
    }
    
    // Perform confirmation in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Re-check status and storeId within transaction to prevent race conditions
      const currentSale = await tx.sale.findFirst({
        where: {
          id,
          storeId: store.id,
        },
        select: { status: true },
      })

      if (!currentSale || currentSale.status !== 'DRAFT') {
        throw new Error('Sale status changed')
      }
      
      // Process each item with atomic stock update
      for (const item of sale.items) {
        // Verify product belongs to the same store
        if (item.product.storeId !== store.id) {
          throw new Error('Product does not belong to this store')
        }
        
        // Atomic stock update using Prisma updateMany with conditions
        // This simulates the conditional update: stock = stock - quantity WHERE stock >= quantity
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            storeId: store.id,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
        
        // If no rows were affected, stock was insufficient
        if (updateResult.count === 0) {
          throw new Error(`Insufficient stock for product: ${item.product.name}`)
        }
        
        // Create StockMovement OUT
        await tx.stockMovement.create({
          data: {
            type: 'OUT',
            quantity: item.quantity,
            productId: item.productId,
            storeId: store.id,
            reason: `Vente ${sale.reference}`,
          },
        })
      }
      
      // Update sale status to CONFIRMED
      const updatedSale = await tx.sale.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      })
      
      return updatedSale
    })
    
    // Serialize response
    const serializedSale = {
      id: result.id,
      reference: result.reference,
      customerId: result.customerId,
      storeId: result.storeId,
      saleDate: result.saleDate,
      status: result.status,
      totalAmount: Number(result.totalAmount),
      notes: result.notes,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      customer: result.customer,
      items: result.items.map((item) => ({
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
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error confirming sale:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === 'Sale status changed') {
        return NextResponse.json(
          { error: 'Seule une vente en brouillon peut être confirmée' },
          { status: 409 }
        )
      }

      if (error.message.startsWith('Insufficient stock')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }

      if (error.message === 'Product does not belong to this store') {
        return NextResponse.json(
          { error: 'Produit introuvable' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to confirm sale' },
      { status: 500 }
    )
  }
}
