import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentStore } from '@/lib/get-current-store'
import { requireRole } from '@/lib/auth-helpers'
import { handleAuthError } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const store = await getCurrentStore()

    // Fetch invoices for this store with sale and customer
    const invoices = await prisma.invoice.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        sale: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: [
        { invoiceDate: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Serialize Decimal to Number for JSON
    const serializedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      reference: invoice.reference,
      saleId: invoice.saleId,
      storeId: invoice.storeId,
      totalAmount: Number(invoice.totalAmount),
      status: invoice.status,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      sale: {
        id: invoice.sale.id,
        reference: invoice.sale.reference,
        saleDate: invoice.sale.saleDate,
        customer: {
          id: invoice.sale.customer.id,
          name: invoice.sale.customer.name,
          phone: invoice.sale.customer.phone,
          email: invoice.sale.customer.email,
        },
      },
    }))

    return NextResponse.json(serializedInvoices)
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
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { saleId, invoiceDate, dueDate, notes } = body

    // Validation
    if (!saleId || typeof saleId !== 'string') {
      return NextResponse.json(
        { error: 'L\'ID de la vente est requis' },
        { status: 400 }
      )
    }

    if (!invoiceDate || typeof invoiceDate !== 'string') {
      return NextResponse.json(
        { error: 'La date de facture est requise' },
        { status: 400 }
      )
    }

    // Validate invoice date
    const parsedInvoiceDate = new Date(invoiceDate)
    if (isNaN(parsedInvoiceDate.getTime())) {
      return NextResponse.json(
        { error: 'Date de facture invalide' },
        { status: 400 }
      )
    }

    // Validate due date if provided
    let parsedDueDate: Date | null = null
    if (dueDate) {
      parsedDueDate = new Date(dueDate)
      if (isNaN(parsedDueDate.getTime())) {
        return NextResponse.json(
          { error: 'Date d\'échéance invalide' },
          { status: 400 }
        )
      }
    }

    // Vérifier les permissions : OWNER, ADMIN, MANAGER
    const { store } = await requireRole(['OWNER', 'ADMIN', 'MANAGER'])

    // Verify sale exists and belongs to this store
    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        storeId: store.id,
      },
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Vente introuvable' },
        { status: 404 }
      )
    }

    // Check sale status - only CONFIRMED can be invoiced
    if (sale.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Seule une vente confirmée peut être facturée' },
        { status: 409 }
      )
    }

    // Check if invoice already exists for this sale
    const existingInvoice = await prisma.invoice.findUnique({
      where: { saleId },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Une facture existe déjà pour cette vente' },
        { status: 409 }
      )
    }

    // Generate unique reference
    let reference: string
    let attempts = 0
    const maxAttempts = 100

    do {
      const timestamp = Date.now().toString().slice(-4)
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      reference = `FAC-${parsedInvoiceDate.toISOString().slice(0, 10).replace(/-/g, '')}-${timestamp}${random}`
      attempts++

      if (attempts > maxAttempts) {
        return NextResponse.json(
          { error: 'Impossible de générer une référence unique' },
          { status: 500 }
        )
      }
    } while (await prisma.invoice.findFirst({
      where: {
        reference,
        storeId: store.id,
      },
    }))

    // Create invoice with totalAmount from sale
    const invoice = await prisma.invoice.create({
      data: {
        reference,
        saleId,
        storeId: store.id,
        totalAmount: sale.totalAmount,
        status: 'UNPAID',
        invoiceDate: parsedInvoiceDate,
        dueDate: parsedDueDate,
        notes: notes?.trim() || null,
      },
      include: {
        sale: {
          include: {
            customer: true,
          },
        },
      },
    })

    // Serialize response
    const serializedInvoice = {
      id: invoice.id,
      reference: invoice.reference,
      saleId: invoice.saleId,
      storeId: invoice.storeId,
      totalAmount: Number(invoice.totalAmount),
      status: invoice.status,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      sale: {
        id: invoice.sale.id,
        reference: invoice.sale.reference,
        saleDate: invoice.sale.saleDate,
        customer: {
          id: invoice.sale.customer.id,
          name: invoice.sale.customer.name,
          phone: invoice.sale.customer.phone,
          email: invoice.sale.customer.email,
        },
      },
    }

    return NextResponse.json(serializedInvoice, { status: 201 })
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error creating invoice:', error)

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Une facture existe déjà pour cette vente' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
