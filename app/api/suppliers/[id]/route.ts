import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get the first available store
    const store = await prisma.store.findFirst()
    if (!store) {
      return NextResponse.json(
        { error: 'Aucun magasin disponible' },
        { status: 500 }
      )
    }
    
    // Find supplier by id AND storeId (security check)
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        storeId: store.id,
      },
    })
    
    if (!supplier) {
      return NextResponse.json(
        { error: 'Fournisseur introuvable' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
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
    
    // Get the first available store
    const store = await prisma.store.findFirst()
    if (!store) {
      return NextResponse.json(
        { error: 'Aucun magasin disponible' },
        { status: 500 }
      )
    }
    
    // Check if supplier exists and belongs to this store
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id,
        storeId: store.id,
      },
    })
    
    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Fournisseur introuvable' },
        { status: 404 }
      )
    }
    
    // Check for duplicate name with another supplier in the same store
    const duplicateSupplier = await prisma.supplier.findFirst({
      where: {
        name: name.trim(),
        storeId: store.id,
        id: { not: id }, // Exclude current supplier
      },
    })
    
    if (duplicateSupplier) {
      return NextResponse.json(
        { error: 'Un fournisseur avec ce nom existe déjà dans ce magasin' },
        { status: 409 }
      )
    }
    
    // Update supplier
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: name.trim(),
        contactName: contactName?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    })
    
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error updating supplier:', error)
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Un fournisseur avec ce nom existe déjà dans ce magasin' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update supplier' },
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
    
    // Get the first available store
    const store = await prisma.store.findFirst()
    if (!store) {
      return NextResponse.json(
        { error: 'Aucun magasin disponible' },
        { status: 500 }
      )
    }
    
    // Check if supplier exists and belongs to this store
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        storeId: store.id,
      },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    })
    
    if (!supplier) {
      return NextResponse.json(
        { error: 'Fournisseur introuvable' },
        { status: 404 }
      )
    }
    
    // Check if supplier has purchases
    if (supplier._count.purchases > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer ce fournisseur car il possède des achats associés' },
        { status: 409 }
      )
    }
    
    // Delete supplier
    await prisma.supplier.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    
    // Handle foreign key constraint violation
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { error: 'Impossible de supprimer ce fournisseur car il possède des achats associés' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}
