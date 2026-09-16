import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get the first available store (consistent with products API)
    const store = await prisma.store.findFirst()
    
    if (!store) {
      return NextResponse.json(
        { error: 'Aucun magasin disponible' },
        { status: 500 }
      )
    }
    
    // Fetch categories for this store, sorted by name
    const categories = await prisma.category.findMany({
      where: {
        storeId: store.id,
      },
      orderBy: {
        name: 'asc',
      },
    })
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
