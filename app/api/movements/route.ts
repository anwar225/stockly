import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get the first available store (consistent with other APIs)
    const store = await prisma.store.findFirst()
    
    if (!store) {
      return NextResponse.json(
        { error: 'Aucun magasin disponible' },
        { status: 500 }
      )
    }
    
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
    
    // Get the first available store
    const store = await prisma.store.findFirst()
    if (!store) {
      return NextResponse.json(
        { error: 'Aucun magasin disponible' },
        { status: 500 }
      )
    }
    
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
    
    // Calculate new stock based on movement type
    let newStock: number
    if (type === 'IN') {
      newStock = product.stock + quantity
    } else if (type === 'OUT') {
      if (quantity > product.stock) {
        return NextResponse.json(
          { error: `Stock insuffisant. Stock actuel: ${product.stock}, Quantité demandée: ${quantity}` },
          { status: 400 }
        )
      }
      newStock = product.stock - quantity
    } else if (type === 'ADJUSTMENT') {
      newStock = quantity
    } else {
      return NextResponse.json(
        { error: 'Type de mouvement invalide' },
        { status: 400 }
      )
    }
    
    // Create movement and update product stock in a single transaction
    const result = await prisma.$transaction(async (tx) => {
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
      
      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
        include: {
          category: true,
          brand: true,
        },
      })
      
      return { movement, updatedProduct }
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
    console.error('Error creating movement:', error)
    return NextResponse.json(
      { error: 'Failed to create movement' },
      { status: 500 }
    )
  }
}
