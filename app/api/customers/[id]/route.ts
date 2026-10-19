import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentStore } from '@/lib/get-current-store'
import { requireRole } from '@/lib/auth-helpers'
import { handleAuthError } from '@/lib/auth-helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const store = await getCurrentStore()
    
    // Find customer by id AND storeId (security check)
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        storeId: store.id,
      },
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Client introuvable' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(customer)
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
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { name, phone, email, address, notes } = body
    
    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom du client est requis' },
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

    // Check if customer exists and belongs to this store
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        storeId: store.id,
      },
    })
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Client introuvable' },
        { status: 404 }
      )
    }
    
    // Update customer
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    })
    
    return NextResponse.json(customer)
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier les permissions : OWNER, ADMIN
    const { store } = await requireRole(['OWNER', 'ADMIN'])

    // Check if customer exists and belongs to this store
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        storeId: store.id,
      },
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Client introuvable' },
        { status: 404 }
      )
    }
    
    // Check if customer has sales
    const salesCount = await prisma.sale.count({
      where: {
        customerId: id,
        storeId: store.id,
      },
    })
    
    if (salesCount > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer ce client car il possède des ventes.' },
        { status: 409 }
      )
    }
    
    // Delete customer
    await prisma.customer.delete({
      where: { id },
    })
    
    return NextResponse.json({ message: 'Client supprimé avec succès' })
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error deleting customer:', error)

    // Handle foreign key constraint violation
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { error: 'Impossible de supprimer ce client car il possède des ventes.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
