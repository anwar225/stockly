import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentStore } from '@/lib/get-current-store'
import { requireRole } from '@/lib/auth-helpers'
import { handleAuthError } from '@/lib/auth-helpers'

export async function GET() {
  try {
    // Vérifier les permissions : OWNER, ADMIN, MANAGER
    const { store } = await requireRole(['OWNER', 'ADMIN', 'MANAGER'])
    
    // Fetch purchases for this store with supplier and items
    const purchases = await prisma.purchase.findMany({
      where: {
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
      orderBy: [
        { purchaseDate: 'desc' },
        { createdAt: 'desc' },
      ],
    })
    
    // Serialize Decimal to Number for JSON
    const serializedPurchases = purchases.map((purchase) => ({
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
    }))
    
    return NextResponse.json(serializedPurchases)
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error fetching purchases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { supplierId, purchaseDate, notes, items } = body
    
    // Validation
    if (!supplierId || typeof supplierId !== 'string') {
      return NextResponse.json(
        { error: 'L\'ID du fournisseur est requis' },
        { status: 400 }
      )
    }
    
    if (!purchaseDate || typeof purchaseDate !== 'string') {
      return NextResponse.json(
        { error: 'La date d\'achat est requise' },
        { status: 400 }
      )
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un article est requis' },
        { status: 400 }
      )
    }
    
    // Validate purchase date
    const parsedDate = new Date(purchaseDate)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Date d\'achat invalide' },
        { status: 400 }
      )
    }
    
    // Validate items
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return NextResponse.json(
          { error: 'L\'ID du produit est requis pour chaque article' },
          { status: 400 }
        )
      }
      
      if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        return NextResponse.json(
          { error: 'La quantité doit être un entier positif' },
          { status: 400 }
        )
      }
      
      if (typeof item.unitPrice !== 'number' || item.unitPrice <= 0) {
        return NextResponse.json(
          { error: 'Le prix unitaire doit être positif' },
          { status: 400 }
        )
      }
    }
    
    // Check for duplicate products in the same purchase
    const productIds = items.map((item) => item.productId)
    const uniqueProductIds = new Set(productIds)
    if (productIds.length !== uniqueProductIds.size) {
      return NextResponse.json(
        { error: 'Un produit ne peut apparaître qu\'une seule fois dans un achat' },
        { status: 400 }
      )
    }

    // Vérifier les permissions : OWNER, ADMIN, MANAGER
    const { store } = await requireRole(['OWNER', 'ADMIN', 'MANAGER'])

    // Calculate line totals and total amount
    const purchaseItems = items.map((item) => {
      const lineTotal = item.quantity * item.unitPrice
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: lineTotal,
      }
    })
    
    const totalAmount = purchaseItems.reduce((sum, item) => sum + item.total, 0)
    
    // Create purchase and items in a single transaction with validation
    const result = await prisma.$transaction(async (tx) => {
      // Verify supplier exists and belongs to this store
      const supplier = await tx.supplier.findFirst({
        where: {
          id: supplierId,
          storeId: store.id,
        },
      })
      
      if (!supplier) {
        throw new Error('Fournisseur introuvable')
      }
      
      // Verify all products exist and belong to this store
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          storeId: store.id,
        },
      })
      
      if (products.length !== productIds.length) {
        throw new Error('Un ou plusieurs produits introuvables ou n\'appartenant pas à ce magasin')
      }
      
      // Generate unique reference with retry mechanism
      let reference: string
      let attempts = 0
      const maxAttempts = 100
      
      do {
        const timestamp = Date.now().toString().slice(-4)
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        reference = `ACH-${parsedDate.toISOString().slice(0, 10).replace(/-/g, '')}-${timestamp}${random}`
        attempts++
        
        if (attempts > maxAttempts) {
          throw new Error('Impossible de générer une référence unique')
        }
      } while (await tx.purchase.findFirst({
        where: {
          reference,
          storeId: store.id,
        },
      }))
      
      // Create purchase - la contrainte @@unique([storeId, reference]) protège contre les doublons
      const purchase = await tx.purchase.create({
        data: {
          reference,
          supplierId,
          storeId: store.id,
          purchaseDate: parsedDate,
          status: 'DRAFT',
          totalAmount,
          notes: notes || null,
        },
      })
      
      const createdItems = await Promise.all(
        purchaseItems.map((item) =>
          tx.purchaseItem.create({
            data: {
              purchaseId: purchase.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            },
          })
        )
      )
      
      return { purchase, items: createdItems }
    })
    
    // Serialize response
    const serializedResponse = {
      purchase: {
        id: result.purchase.id,
        reference: result.purchase.reference,
        supplierId: result.purchase.supplierId,
        storeId: result.purchase.storeId,
        purchaseDate: result.purchase.purchaseDate,
        status: result.purchase.status,
        totalAmount: Number(result.purchase.totalAmount),
        notes: result.purchase.notes,
        createdAt: result.purchase.createdAt,
        updatedAt: result.purchase.updatedAt,
      },
      items: result.items.map((item) => ({
        id: item.id,
        purchaseId: item.purchaseId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        createdAt: item.createdAt,
      })),
    }
    
    return NextResponse.json(serializedResponse, { status: 201 })
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error creating purchase:', error)

    // Handle unique constraint violation (reference already exists)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Cette référence existe déjà' },
        { status: 409 }
      )
    }

    // Handle validation errors from transaction
    if (error instanceof Error) {
      if (error.message === 'Fournisseur introuvable') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      if (error.message === 'Un ou plusieurs produits introuvables ou n\'appartenant pas à ce magasin') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      if (error.message === 'Impossible de générer une référence unique') {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create purchase' },
      { status: 500 }
    )
  }
}
