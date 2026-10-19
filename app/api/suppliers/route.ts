import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentStore } from '@/lib/get-current-store'
import { requireRole } from '@/lib/auth-helpers'
import { handleAuthError } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const store = await getCurrentStore()
    
    // Fetch suppliers for this store, sorted by name
    const suppliers = await prisma.supplier.findMany({
      where: {
        storeId: store.id,
      },
      orderBy: {
        name: 'asc',
      },
    })
    
    return NextResponse.json(suppliers)
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
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { name, contactName, phone, email, address, notes } = body
    
    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom du fournisseur est requis' },
        { status: 400 }
      )
    }
    
    // Email validation (basic)
    if (email && typeof email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: 'Email invalide' },
          { status: 400 }
        )
      }
    }

    // Vérifier les permissions : OWNER, ADMIN, MANAGER
    const { store } = await requireRole(['OWNER', 'ADMIN', 'MANAGER'])

    // Check for duplicate supplier name in this store
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        name: name.trim(),
        storeId: store.id,
      },
    })
    
    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Un fournisseur avec ce nom existe déjà dans ce magasin' },
        { status: 409 }
      )
    }
    
    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        contactName: contactName?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        storeId: store.id,
      },
    })
    
    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error creating supplier:', error)

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Un fournisseur avec ce nom existe déjà dans ce magasin' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}
