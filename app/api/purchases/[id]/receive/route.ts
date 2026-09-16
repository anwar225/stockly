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
    
    // Find purchase by id AND storeId
    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        storeId: store.id,
      },
      include: {
        items: true,
      },
    })
    
    if (!purchase) {
      return NextResponse.json(
        { error: 'Achat introuvable' },
        { status: 404 }
      )
    }
    
    // Check if purchase can be received (must be ORDERED)
    if (purchase.status !== 'ORDERED') {
      return NextResponse.json(
        { error: 'Cet achat ne peut pas être réceptionné. Statut actuel: ' + purchase.status },
        { status: 400 }
      )
    }
    
    // Receive purchase in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stock movements and update product stock for each item
      for (const item of purchase.items) {
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
        
        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }
      
      // Update purchase status to RECEIVED
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
    console.error('Error receiving purchase:', error)
    return NextResponse.json(
      { error: 'Failed to receive purchase' },
      { status: 500 }
    )
  }
}
