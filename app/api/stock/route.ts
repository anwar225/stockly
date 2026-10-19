import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentStore } from '@/lib/get-current-store'

export async function GET() {
  try {
    const store = await getCurrentStore()
    
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
    console.error('Error fetching stock data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}
