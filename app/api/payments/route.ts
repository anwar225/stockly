import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentStore } from '@/lib/get-current-store'
import { requireRole } from '@/lib/auth-helpers'
import { handleAuthError } from '@/lib/auth-helpers'
import { Prisma } from '@/lib/generated/prisma/client'

export async function GET() {
  try {
    const store = await getCurrentStore()

    // Fetch payments for this store with invoice and sale details
    const payments = await prisma.payment.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        invoice: {
          include: {
            sale: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
      orderBy: [
        { paymentDate: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Serialize Decimal to Number for JSON
    const serializedPayments = payments.map((payment) => ({
      id: payment.id,
      invoiceId: payment.invoiceId,
      storeId: payment.storeId,
      amount: Number(payment.amount),
      method: payment.method,
      paymentDate: payment.paymentDate,
      reference: payment.reference,
      externalReference: payment.externalReference,
      notes: payment.notes,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      invoice: {
        id: payment.invoice.id,
        reference: payment.invoice.reference,
        totalAmount: Number(payment.invoice.totalAmount),
        status: payment.invoice.status,
        sale: {
          id: payment.invoice.sale.id,
          reference: payment.invoice.sale.reference,
          customer: {
            id: payment.invoice.sale.customer.id,
            name: payment.invoice.sale.customer.name,
          },
        },
      },
    }))

    return NextResponse.json(serializedPayments)
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
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { invoiceId, amount, method, paymentDate, reference, externalReference, notes } = body

    // Validation
    if (!invoiceId || typeof invoiceId !== 'string' || invoiceId.trim().length === 0) {
      return NextResponse.json(
        { error: 'L\'ID de la facture est requis' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Le montant doit être un nombre positif' },
        { status: 400 }
      )
    }

    const validMethods = ['CASH', 'CARD', 'BANK_TRANSFER', 'CHECK']
    if (!method || typeof method !== 'string' || !validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Méthode de paiement invalide' },
        { status: 400 }
      )
    }

    if (!paymentDate || typeof paymentDate !== 'string') {
      return NextResponse.json(
        { error: 'La date de paiement est requise' },
        { status: 400 }
      )
    }

    // Validate payment date
    const parsedPaymentDate = new Date(paymentDate)
    if (isNaN(parsedPaymentDate.getTime())) {
      return NextResponse.json(
        { error: 'Date de paiement invalide' },
        { status: 400 }
      )
    }

    // Vérifier les permissions : OWNER, ADMIN, MANAGER
    const { store } = await requireRole(['OWNER', 'ADMIN', 'MANAGER'])

    // Perform payment creation in a transaction with row locking
    const result = await prisma.$transaction(async (tx) => {
      // Lock the invoice row with FOR UPDATE
      await tx.$queryRaw`
        SELECT id
        FROM "Invoice"
        WHERE id = ${invoiceId}
          AND "storeId" = ${store.id}
        FOR UPDATE
      `

      // Re-fetch the invoice within the transaction
      const invoice = await tx.invoice.findFirst({
        where: {
          id: invoiceId,
          storeId: store.id,
        },
      })

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Check if invoice is already paid
      if (invoice.status === 'PAID') {
        throw new Error('Invoice already paid')
      }

      // Calculate current total paid
      const currentPaid = await tx.payment.aggregate({
        where: { invoiceId },
        _sum: { amount: true },
      })

      const totalPaid = currentPaid._sum.amount || 0
      const remaining = invoice.totalAmount.sub(totalPaid)

      // Validate payment amount doesn't exceed remaining
      const paymentAmount = new Prisma.Decimal(amount)
      if (paymentAmount.gt(remaining)) {
        throw new Error('Payment exceeds remaining amount')
      }

      // Create the payment
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          storeId: store.id,
          amount: paymentAmount,
          method: method as 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK',
          paymentDate: parsedPaymentDate,
          reference: reference?.trim() || null,
          externalReference: externalReference?.trim() || null,
          notes: notes?.trim() || null,
        },
      })

      // Recalculate total paid after new payment
      const newTotalPaid = await tx.payment.aggregate({
        where: { invoiceId },
        _sum: { amount: true },
      })

      const finalTotalPaid = newTotalPaid._sum.amount || 0

      // Determine new invoice status
      let newStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'UNPAID'
      const finalTotalPaidNum = Number(finalTotalPaid)
      const invoiceTotalNum = Number(invoice.totalAmount)
      if (finalTotalPaidNum === invoiceTotalNum) {
        newStatus = 'PAID'
      } else if (finalTotalPaidNum > 0) {
        newStatus = 'PARTIALLY_PAID'
      }

      // Update invoice status
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      })

      return { payment, newStatus }
    })

    // Serialize response
    const serializedPayment = {
      id: result.payment.id,
      invoiceId: result.payment.invoiceId,
      storeId: result.payment.storeId,
      amount: Number(result.payment.amount),
      method: result.payment.method,
      paymentDate: result.payment.paymentDate,
      reference: result.payment.reference,
      externalReference: result.payment.externalReference,
      notes: result.payment.notes,
      createdAt: result.payment.createdAt,
      updatedAt: result.payment.updatedAt,
    }

    return NextResponse.json(serializedPayment, { status: 201 })
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error creating payment:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === 'Invoice not found') {
        return NextResponse.json(
          { error: 'Facture introuvable' },
          { status: 404 }
        )
      }

      if (error.message === 'Invoice already paid') {
        return NextResponse.json(
          { error: 'Cette facture est déjà entièrement payée' },
          { status: 409 }
        )
      }

      if (error.message === 'Payment exceeds remaining amount') {
        return NextResponse.json(
          { error: 'Le montant du paiement dépasse le montant restant dû' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
