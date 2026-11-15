import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentStore } from '@/lib/get-current-store'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(2).max(100),
})

export async function GET() {
  try {
    const store = await getCurrentStore()
    
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
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const store = await getCurrentStore()

    const body = await request.json()

    // Validate request body
    const validation = categorySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name } = validation.data

    // Check if category already exists in this store
    const existingCategory = await prisma.category.findFirst({
      where: {
        storeId: store.id,
        name,
      },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Une catégorie avec ce nom existe déjà' },
        { status: 409 }
      )
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name,
        storeId: store.id,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHENTICATED') {
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        )
      }
      if (error.message === 'USER_DISABLED') {
        return NextResponse.json(
          { error: 'Compte désactivé' },
          { status: 403 }
        )
      }
      if (error.message === 'NO_STORE_ACCESS') {
        return NextResponse.json(
          { error: 'Aucun magasin disponible' },
          { status: 403 }
        )
      }
      if (error.message === 'STORE_ACCESS_DENIED') {
        return NextResponse.json(
          { error: 'Accès au magasin refusé' },
          { status: 403 }
        )
      }
    }
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la catégorie' },
      { status: 500 }
    )
  }
}
