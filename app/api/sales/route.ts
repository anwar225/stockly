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
    
    // Fetch sales for this store with customer and items
    const sales = await prisma.sale.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: [
        { saleDate: 'desc' },
        { createdAt: 'desc' },
      ],
    })
    
    // Serialize Decimal to Number for JSON
    const serializedSales = sales.map((sale) => ({
      id: sale.id,
      reference: sale.reference,
      customerId: sale.customerId,
      storeId: sale.storeId,
      saleDate: sale.saleDate,
      status: sale.status,
      totalAmount: Number(sale.totalAmount),
      notes: sale.notes,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      customer: sale.customer,
      items: sale.items.map((item) => ({
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
    }))
    
    return NextResponse.json(serializedSales)
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { customerId, saleDate, notes, items } = body
    
    // Validation
    if (!customerId || typeof customerId !== 'string') {
      return NextResponse.json(
        { error: 'L\'ID du client est requis' },
        { status: 400 }
      )
    }
    
    if (!saleDate || typeof saleDate !== 'string') {
      return NextResponse.json(
        { error: 'La date de vente est requise' },
        { status: 400 }
      )
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un article est requis' },
        { status: 400 }
      )
    }
    
    // Validate sale date
    const parsedDate = new Date(saleDate)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Date de vente invalide' },
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
    }
    
    // Check for duplicate products in the same sale
    const productIds = items.map((item) => item.productId)
    const uniqueProductIds = new Set(productIds)
    if (productIds.length !== uniqueProductIds.size) {
      return NextResponse.json(
        { error: 'Un produit ne peut apparaître qu\'une seule fois dans une vente' },
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
    
    // Verify customer exists and belongs to this store
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        storeId: store.id,
      },
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Client introuvable' },
        { status: 404 }
      )
    }
    
    // Verify all products exist and belong to this store
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        storeId: store.id,
      },
    })
    
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Un ou plusieurs produits introuvables ou n\'appartenant pas à ce magasin' },
        { status: 404 }
      )
    }
    
    // Generate unique reference
    let reference: string
    let attempts = 0
    const maxAttempts = 100
    
    do {
      const timestamp = Date.now().toString().slice(-4)
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      reference = `VTE-${parsedDate.toISOString().slice(0, 10).replace(/-/g, '')}-${timestamp}${random}`
      attempts++
      
      if (attempts > maxAttempts) {
        return NextResponse.json(
          { error: 'Impossible de générer une référence unique' },
          { status: 500 }
        )
      }
    } while (await prisma.sale.findFirst({
      where: {
        reference,
        storeId: store.id,
      },
    }))
    
    // Create product map for price lookup
    const productMap = new Map(products.map((p) => [p.id, p]))
    
    // Calculate line totals and total amount using server-side prices
    const saleItems = items.map((item) => {
      const product = productMap.get(item.productId)!
      const unitPrice = Number(product.sellingPrice)
      const lineTotal = item.quantity * unitPrice
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        total: lineTotal,
      }
    })
    
    const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0)
    
    // Create sale and items in a single transaction
    // DRAFT creation does NOT modify stock or create StockMovement
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          reference,
          customerId,
          storeId: store.id,
          saleDate: parsedDate,
          status: 'DRAFT',
          totalAmount,
          notes: notes?.trim() || null,
        },
      })
      
      const createdItems = await Promise.all(
        saleItems.map((item) =>
          tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            },
          })
        )
      )
      
      return { sale, items: createdItems }
    })
    
    // Serialize response
    const serializedResponse = {
      sale: {
        id: result.sale.id,
        reference: result.sale.reference,
        customerId: result.sale.customerId,
        storeId: result.sale.storeId,
        saleDate: result.sale.saleDate,
        status: result.sale.status,
        totalAmount: Number(result.sale.totalAmount),
        notes: result.sale.notes,
        createdAt: result.sale.createdAt,
        updatedAt: result.sale.updatedAt,
      },
      items: result.items.map((item) => ({
        id: item.id,
        saleId: item.saleId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        createdAt: item.createdAt,
      })),
    }
    
    return NextResponse.json(serializedResponse, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Cette référence existe déjà' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    )
  }
}
