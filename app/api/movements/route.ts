import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentStore } from '@/lib/get-current-store'
import { requireRole } from '@/lib/auth-helpers'
import { handleAuthError } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const store = await getCurrentStore()
    
    // Fetch movements for this store with product info
    const movements = await prisma.stockMovement.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    // Serialize movements
    const serializedMovements = movements.map((movement) => ({
      id: movement.id,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      createdAt: movement.createdAt,
      product: {
        id: movement.product.id,
        name: movement.product.name,
        sku: movement.product.sku,
        stock: movement.product.stock,
        category: movement.product.category?.name || null,
        brand: movement.product.brand?.name || null,
      },
    }))
    
    return NextResponse.json(serializedMovements)
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
    console.error('Error fetching movements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movements' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { productId, type, quantity, reason } = body
    
    // Validation
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { error: 'L\'ID du produit est requis' },
        { status: 400 }
      )
    }
    
    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { error: 'Le type de mouvement est requis' },
        { status: 400 }
      )
    }
    
    if (!['IN', 'OUT', 'ADJUSTMENT'].includes(type)) {
      return NextResponse.json(
        { error: 'Type de mouvement invalide (IN, OUT, ADJUSTMENT)' },
        { status: 400 }
      )
    }
    
    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: 'La quantité doit être un entier' },
        { status: 400 }
      )
    }
    
    // IN and OUT require quantity > 0, ADJUSTMENT allows quantity >= 0
    if ((type === 'IN' || type === 'OUT') && quantity <= 0) {
      return NextResponse.json(
        { error: 'Pour une entrée ou une sortie, la quantité doit être supérieure à 0.' },
        { status: 400 }
      )
    }
    
    if (quantity < 0) {
      return NextResponse.json(
        { error: 'La quantité ne peut pas être négative' },
        { status: 400 }
      )
    }

    // Vérifier les permissions : OWNER, ADMIN, MANAGER
    const { store } = await requireRole(['OWNER', 'ADMIN', 'MANAGER'])

    // Verify product exists and belongs to this store
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })
    
    if (!product) {
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      )
    }
    
    if (product.storeId !== store.id) {
      return NextResponse.json(
        { error: 'Ce produit n\'appartient pas à ce magasin' },
        { status: 400 }
      )
    }
    
    // Create movement and update product stock in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      let updatedProduct
      
      if (type === 'IN') {
        // Increment stock atomically
        updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            stock: {
              increment: quantity,
            },
          },
          include: {
            category: true,
            brand: true,
          },
        })
      } else if (type === 'OUT') {
        // Decrement stock atomically with condition to prevent negative stock
        const updateResult = await tx.product.updateMany({
          where: {
            id: productId,
            storeId: store.id,
            stock: {
              gte: quantity,
            },
          },
          data: {
            stock: {
              decrement: quantity,
            },
          },
        })
        
        // If no rows were affected, stock was insufficient
        if (updateResult.count === 0) {
          const currentProduct = await tx.product.findUnique({
            where: { id: productId },
            select: { stock: true },
          })
          throw new Error(`Stock insuffisant. Stock actuel: ${currentProduct?.stock || 0}, Quantité demandée: ${quantity}`)
        }
        
        updatedProduct = await tx.product.findUniqueOrThrow({
          where: { id: productId },
          include: {
            category: true,
            brand: true,
          },
        })
      } else if (type === 'ADJUSTMENT') {
        // Set stock to exact value
        updatedProduct = await tx.product.update({
          where: { id: productId },
          data: { stock: quantity },
          include: {
            category: true,
            brand: true,
          },
        })
      } else {
        throw new Error('Type de mouvement invalide')
      }
      
      // Create the movement
      const movement = await tx.stockMovement.create({
        data: {
          type: type as 'IN' | 'OUT' | 'ADJUSTMENT',
          quantity,
          reason: reason || null,
          productId,
          storeId: store.id,
        },
      })
      
      return { movement, updatedProduct: updatedProduct! }
    })
    
    // Serialize response
    const serializedResponse = {
      movement: {
        id: result.movement.id,
        type: result.movement.type,
        quantity: result.movement.quantity,
        reason: result.movement.reason,
        createdAt: result.movement.createdAt,
      },
      product: {
        id: result.updatedProduct.id,
        name: result.updatedProduct.name,
        sku: result.updatedProduct.sku,
        stock: result.updatedProduct.stock,
        minStock: result.updatedProduct.minStock,
        purchasePrice: Number(result.updatedProduct.purchasePrice),
        sellingPrice: Number(result.updatedProduct.sellingPrice),
        category: result.updatedProduct.category?.name || null,
        brand: result.updatedProduct.brand?.name || null,
      },
    }
    
    return NextResponse.json(serializedResponse, { status: 201 })
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error creating movement:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.startsWith('Stock insuffisant')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create movement' },
      { status: 500 }
    )
  }
}
