import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
})

async function main() {
  console.log('🔍 Recherche du magasin par défaut...')

  // Récupérer le premier store disponible
  const store = await prisma.store.findFirst()

  if (!store) {
    console.error('❌ Aucun magasin trouvé. Créez d\'abord un magasin.')
    process.exit(1)
  }

  console.log(`✅ Magasin trouvé: ${store.name} (ID: ${store.id})`)

  // Récupérer un utilisateur OWNER/ADMIN/MANAGER
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { role: 'OWNER' },
        { role: 'ADMIN' },
        { role: 'MANAGER' },
      ],
    },
  })

  if (!user) {
    console.error('❌ Aucun utilisateur OWNER/ADMIN/MANAGER trouvé.')
    process.exit(1)
  }

  console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`)

  // Vérifier si l'utilisateur est membre du store
  let storeMember = await prisma.storeMember.findUnique({
    where: {
      userId_storeId: {
        userId: user.id,
        storeId: store.id,
      },
    },
  })

  if (!storeMember) {
    console.log('⚠️  L\'utilisateur n\'est pas membre du store. Création du membership...')
    storeMember = await prisma.storeMember.create({
      data: {
        userId: user.id,
        storeId: store.id,
        role: 'OWNER',
      },
    })
    console.log('✅ Membership créé')
  }

  console.log(`✅ Role dans le store: ${storeMember.role}`)

  // Nettoyer les données de test existantes (dans le bon ordre pour respecter les clés étrangères)
  console.log('🧹 Nettoyage des données de test existantes...')

  // D'abord, trouver tous les produits TEST
  const testProducts = await prisma.product.findMany({
    where: {
      sku: {
        startsWith: 'TEST-',
      },
    },
    select: { id: true },
  })

  if (testProducts.length > 0) {
    const productIds = testProducts.map(p => p.id)

    // Supprimer les purchaseItems qui référencent ces produits
    await prisma.purchaseItem.deleteMany({
      where: {
        productId: {
          in: productIds,
        },
      },
    })

    // Supprimer les saleItems qui référencent ces produits
    await prisma.saleItem.deleteMany({
      where: {
        productId: {
          in: productIds,
        },
      },
    })

    // Supprimer les stockMovements qui référencent ces produits
    await prisma.stockMovement.deleteMany({
      where: {
        productId: {
          in: productIds,
        },
      },
    })
  }

  // Supprimer les items d'achat avant les achats
  const testPurchases = await prisma.purchase.findMany({
    where: {
      reference: {
        startsWith: 'TEST-',
      },
    },
    select: { id: true },
  })
  if (testPurchases.length > 0) {
    await prisma.purchaseItem.deleteMany({
      where: {
        purchaseId: {
          in: testPurchases.map(p => p.id),
        },
      },
    })
  }

  // Supprimer les items de vente avant les ventes
  const testSales = await prisma.sale.findMany({
    where: {
      reference: {
        startsWith: 'TEST-',
      },
    },
    select: { id: true },
  })
  if (testSales.length > 0) {
    await prisma.saleItem.deleteMany({
      where: {
        saleId: {
          in: testSales.map(s => s.id),
        },
      },
    })
  }

  // Supprimer les factures avant les ventes
  await prisma.invoice.deleteMany({
    where: {
      reference: {
        startsWith: 'TEST-',
      },
    },
  })

  // Supprimer les paiements avant les factures
  await prisma.payment.deleteMany({
    where: {
      invoice: {
        reference: {
          startsWith: 'TEST-',
        },
      },
    },
  })

  await prisma.purchase.deleteMany({
    where: {
      reference: {
        startsWith: 'TEST-',
      },
    },
  })

  await prisma.sale.deleteMany({
    where: {
      reference: {
        startsWith: 'TEST-',
      },
    },
  })

  await prisma.stockMovement.deleteMany({
    where: {
      reason: {
        startsWith: 'TEST-',
      },
    },
  })

  await prisma.product.deleteMany({
    where: {
      sku: {
        startsWith: 'TEST-',
      },
    },
  })

  await prisma.customer.deleteMany({
    where: {
      name: {
        startsWith: 'TEST-',
      },
    },
  })

  await prisma.supplier.deleteMany({
    where: {
      name: {
        startsWith: 'TEST-',
      },
    },
  })

  await prisma.category.deleteMany({
    where: {
      name: {
        startsWith: 'TEST-',
      },
    },
  })

  await prisma.brand.deleteMany({
    where: {
      name: {
        startsWith: 'TEST-',
      },
    },
  })

  console.log('✅ Données de test nettoyées')

  // Créer les données de test
  console.log('📦 Création des données de test...')

  // Créer un fournisseur de test
  const supplier = await prisma.supplier.create({
    data: {
      name: 'TEST-Fournisseur Pilote',
      phone: '+212600000000',
      email: 'test-fournisseur@stockly.ma',
      storeId: store.id,
    },
  })
  console.log(`✅ Fournisseur créé: ${supplier.name} (ID: ${supplier.id})`)

  // Créer un client de test
  const customer = await prisma.customer.create({
    data: {
      name: 'TEST-Client Pilote',
      phone: '+212600000001',
      email: 'test-client@stockly.ma',
      storeId: store.id,
    },
  })
  console.log(`✅ Client créé: ${customer.name} (ID: ${customer.id})`)

  // Créer une catégorie de test
  const category = await prisma.category.create({
    data: {
      name: 'TEST-Catégorie Pilote',
      storeId: store.id,
    },
  })
  console.log(`✅ Catégorie créée: ${category.name} (ID: ${category.id})`)

  // Créer une marque de test
  const brand = await prisma.brand.create({
    data: {
      name: 'TEST-Marque Pilote',
      storeId: store.id,
    },
  })
  console.log(`✅ Marque créée: ${brand.name} (ID: ${brand.id})`)

  // Créer un produit de test avec stock = 10
  const product = await prisma.product.create({
    data: {
      name: 'TEST-Produit Pilote',
      sku: 'TEST-PILOTE-001',
      description: 'Produit de test pour le pilote Stockly',
      purchasePrice: 100,
      sellingPrice: 150,
      stock: 10,
      minStock: 2,
      categoryId: category.id,
      brandId: brand.id,
      storeId: store.id,
    },
  })
  console.log(`✅ Produit créé: ${product.name} (SKU: ${product.sku}, Stock: ${product.stock}, ID: ${product.id})`)

  // Créer un deuxième produit de test avec stock = 3 (pour test stock insuffisant)
  const productLowStock = await prisma.product.create({
    data: {
      name: 'TEST-Produit Stock Faible',
      sku: 'TEST-LOW-STOCK-001',
      description: 'Produit de test avec stock faible',
      purchasePrice: 50,
      sellingPrice: 75,
      stock: 3,
      minStock: 1,
      categoryId: category.id,
      brandId: brand.id,
      storeId: store.id,
    },
  })
  console.log(`✅ Produit faible stock créé: ${productLowStock.name} (SKU: ${productLowStock.sku}, Stock: ${productLowStock.stock}, ID: ${productLowStock.id})`)

  // Créer un troisième produit de test avec stock = 2 (pour test mouvement OUT)
  const productMovement = await prisma.product.create({
    data: {
      name: 'TEST-Produit Mouvement',
      sku: 'TEST-MOVEMENT-001',
      description: 'Produit de test pour mouvements',
      purchasePrice: 30,
      sellingPrice: 45,
      stock: 2,
      minStock: 1,
      categoryId: category.id,
      brandId: brand.id,
      storeId: store.id,
    },
  })
  console.log(`✅ Produit mouvement créé: ${productMovement.name} (SKU: ${productMovement.sku}, Stock: ${productMovement.stock}, ID: ${productMovement.id})`)

  // Afficher le résumé
  console.log('\n' + '='.repeat(60))
  console.log('📋 RÉSUMÉ DES DONNÉES DE TEST')
  console.log('='.repeat(60))
  console.log(`Store ID: ${store.id}`)
  console.log(`User ID: ${user.id}`)
  console.log(`User Email: ${user.email}`)
  console.log(`Supplier ID: ${supplier.id}`)
  console.log(`Customer ID: ${customer.id}`)
  console.log(`Product ID (stock=10): ${product.id}`)
  console.log(`Product ID (stock=3): ${productLowStock.id}`)
  console.log(`Product ID (stock=2): ${productMovement.id}`)
  console.log('='.repeat(60))
  console.log('\n✅ Données de test préparées avec succès !')
  console.log('⚠️  Ne modifiez pas ces données pendant les tests.')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
