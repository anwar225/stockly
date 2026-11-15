import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentStore } from '@/lib/get-current-store'
import { z } from 'zod'

const brandSchema = z.object({
  name: z.string().min(2).max(100),
})

export async function GET() {
  try {
    const store = await getCurrentStore()

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
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const store = await getCurrentStore()

    const body = await request.json()

    // Validate request body
    const validation = brandSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name } = validation.data

    // Check if brand already exists in this store
    const existingBrand = await prisma.brand.findFirst({
      where: {
        storeId: store.id,
        name,
      },
    })

    if (existingBrand) {
      return NextResponse.json(
        { error: 'Une marque avec ce nom existe déjà' },
        { status: 409 }
      )
    }

    // Create brand
    const brand = await prisma.brand.create({
      data: {
        name,
        storeId: store.id,
      },
    })

    return NextResponse.json(brand, { status: 201 })
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
    console.error('Error creating brand:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la marque' },
      { status: 500 }
    )
  }
}
