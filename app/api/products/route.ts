import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
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
    
    // Récupérer le premier store disponible (temporaire pour MVP sans auth)
    const store = await prisma.store.findFirst()
    if (!store) {
      return NextResponse.json(
        { error: 'Aucun magasin disponible' },
        { status: 500 }
      )
    }
    
    // Vérifier que le SKU n'existe pas déjà dans ce store
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku: sku,
        storeId: store.id,
      },
    })
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Ce SKU existe déjà dans ce magasin' },
        { status: 409 }
      )
    }
    
    // Valider categoryId si fourni
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      })
      if (!category) {
        return NextResponse.json(
          { error: 'Catégorie invalide' },
          { status: 400 }
        )
      }
    }
    
    // Valider brandId si fourni
    if (brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
      })
      if (!brand) {
        return NextResponse.json(
          { error: 'Marque invalide' },
          { status: 400 }
        )
      }
    }
    
    // Créer le produit
    const product = await prisma.product.create({
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
    
    // Convertir Decimal en Number pour la réponse
    const serializedProduct = {
      ...product,
      purchasePrice: Number(product.purchasePrice),
      sellingPrice: Number(product.sellingPrice),
    }
    
    return NextResponse.json(serializedProduct, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
