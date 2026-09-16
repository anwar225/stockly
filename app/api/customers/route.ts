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
    
    // Fetch customers for this store
    const customers = await prisma.customer.findMany({
      where: {
        storeId: store.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
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
    
    // Get the first available store
    const store = await prisma.store.findFirst()
    if (!store) {
      return NextResponse.json(
        { error: 'Aucun magasin disponible' },
        { status: 500 }
      )
    }
    
    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        storeId: store.id,
      },
    })
    
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
