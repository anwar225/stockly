import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentStore } from '@/lib/get-current-store'
import { requireRole } from '@/lib/auth-helpers'
import { handleAuthError } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const store = await getCurrentStore()

    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        category: true,
        brand: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert Decimal to Number for JSON serialization
    const serializedProducts = products.map((product) => ({
      ...product,
      purchasePrice: Number(product.purchasePrice),
      sellingPrice: Number(product.sellingPrice),
    }))

    return NextResponse.json(serializedProducts)
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
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { name, sku, description, purchasePrice, sellingPrice, stock, minStock, categoryId, brandId } = body
    
    // Validation des données
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom du produit est requis' },
        { status: 400 }
      )
    }
    
    if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
      return NextResponse.json(
        { error: 'La référence SKU est requise' },
        { status: 400 }
      )
    }
    
    if (typeof purchasePrice !== 'number' || purchasePrice < 0) {
      return NextResponse.json(
        { error: 'Le prix d\'achat doit être un nombre positif' },
        { status: 400 }
      )
    }
    
    if (typeof sellingPrice !== 'number' || sellingPrice < 0) {
      return NextResponse.json(
        { error: 'Le prix de vente doit être un nombre positif' },
        { status: 400 }
      )
    }
    
    if (typeof stock !== 'number' || stock < 0) {
      return NextResponse.json(
        { error: 'Le stock doit être un nombre positif' },
        { status: 400 }
      )
    }
    
    if (typeof minStock !== 'number' || minStock < 0) {
      return NextResponse.json(
        { error: 'Le stock minimum doit être un nombre positif' },
        { status: 400 }
      )
    }

    // Vérifier les permissions : OWNER, ADMIN, MANAGER
    const { store } = await requireRole(['OWNER', 'ADMIN', 'MANAGER'])

    // Créer le produit dans une transaction avec validation
    const product = await prisma.$transaction(async (tx) => {
      // Valider categoryId si fourni
      if (categoryId) {
        const category = await tx.category.findUnique({
          where: { id: categoryId },
        })
        if (!category) {
          throw new Error('Catégorie invalide')
        }
      }
      
      // Valider brandId si fourni
      if (brandId) {
        const brand = await tx.brand.findUnique({
          where: { id: brandId },
        })
        if (!brand) {
          throw new Error('Marque invalide')
        }
      }
      
      // Créer le produit - la contrainte @@unique([storeId, sku]) protège contre les doublons
      return await tx.product.create({
        data: {
          name: name.trim(),
          sku: sku.trim(),
          description: description || null,
          purchasePrice: purchasePrice,
          sellingPrice: sellingPrice,
          stock: stock,
          minStock: minStock,
          categoryId: categoryId || null,
          brandId: brandId || null,
          storeId: store.id,
        },
        include: {
          category: true,
          brand: true,
        },
      })
    })
    
    // Convertir Decimal en Number pour la réponse
    const serializedProduct = {
      ...product,
      purchasePrice: Number(product.purchasePrice),
      sellingPrice: Number(product.sellingPrice),
    }
    
    return NextResponse.json(serializedProduct, { status: 201 })
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error creating product:', error)

    // Handle unique constraint violation (SKU already exists)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Ce SKU existe déjà dans ce magasin' },
        { status: 409 }
      )
    }

    // Handle validation errors from transaction
    if (error instanceof Error && (error.message === 'Catégorie invalide' || error.message === 'Marque invalide')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
