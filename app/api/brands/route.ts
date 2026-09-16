import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get the first available store (consistent with products and categories APIs)
    const store = await prisma.store.findFirst()
    
    if (!store) {
      return NextResponse.json(
        { error: 'Aucun magasin disponible' },
        { status: 500 }
      )
    }
    
    // Fetch brands for this store, sorted by name
    const brands = await prisma.brand.findMany({
      where: {
        storeId: store.id,
      },
      orderBy: {
        name: 'asc',
      },
    })
    
    return NextResponse.json(brands)
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}
