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
    
    // Fetch products for this store with category and brand
    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        category: true,
        brand: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    
    // Convert Decimal to Number for JSON serialization
    const serializedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock: product.stock,
      minStock: product.minStock,
      sellingPrice: Number(product.sellingPrice),
      category: product.category?.name || null,
      brand: product.brand?.name || null,
    }))
    
    return NextResponse.json(serializedProducts)
  } catch (error) {
    console.error('Error fetching stock data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}
