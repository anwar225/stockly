import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function validateCampaignId(campaignId: string): boolean {
  // L'identifiant de campagne doit être alphanumérique avec tirets, underscores et espaces
  const pattern = /^[a-zA-Z0-9_\- ]+$/
  return pattern.test(campaignId) && campaignId.length >= 10
}

function getTestData(campaignId: string) {
  return {
    orgA: {
      name: `TEST_ORG_A_${campaignId}`,
      email: `test_org_a_${campaignId}@stockly.test`,
      storeName: `TEST_STORE_A_${campaignId}`,
      password: 'TestPassword123',
    },
    orgB: {
      name: `TEST_ORG_B_${campaignId}`,
      email: `test_org_b_${campaignId}@stockly.test`,
      storeName: `TEST_STORE_B_${campaignId}`,
      password: 'TestPassword123',
    },
    // Données métier
    categoryA: `TEST_CAT_A_${campaignId}`,
    categoryB: `TEST_CAT_B_${campaignId}`,
    brandA: `TEST_BRAND_A_${campaignId}`,
    brandB: `TEST_BRAND_B_${campaignId}`,
    productA: `TEST_PROD_A_${campaignId}`,
    productB: `TEST_PROD_B_${campaignId}`,
    skuA: `TEST-SKU-A-${campaignId}`,
    skuB: `TEST-SKU-B-${campaignId}`,
    supplierA: `TEST_SUPP_A_${campaignId}`,
    supplierB: `TEST_SUPP_B_${campaignId}`,
    customerA: `TEST_CUST_A_${campaignId}`,
    customerB: `TEST_CUST_B_${campaignId}`,
  }
}

async function checkConflicts(campaignId: string, testData: ReturnType<typeof getTestData>) {
  console.log('\n=== Vérification des conflits ===\n')

  const conflicts: string[] = []

  // Vérifier les organisations
  const existingOrgA = await prisma.organization.findFirst({
    where: { name: testData.orgA.name },
  })
  if (existingOrgA) {
    conflicts.push(`Organisation A existe déjà : ${testData.orgA.name}`)
  }

  const existingOrgB = await prisma.organization.findFirst({
    where: { name: testData.orgB.name },
  })
  if (existingOrgB) {
    conflicts.push(`Organisation B existe déjà : ${testData.orgB.name}`)
  }

  // Vérifier les utilisateurs
  const existingUserA = await prisma.user.findFirst({
    where: { email: testData.orgA.email },
  })
  if (existingUserA) {
    conflicts.push(`Utilisateur A existe déjà : ${testData.orgA.email}`)
  }

  const existingUserB = await prisma.user.findFirst({
    where: { email: testData.orgB.email },
  })
  if (existingUserB) {
    conflicts.push(`Utilisateur B existe déjà : ${testData.orgB.email}`)
  }

  // Vérifier les magasins
  const existingStoreA = await prisma.store.findFirst({
    where: { name: testData.orgA.storeName },
  })
  if (existingStoreA) {
    conflicts.push(`Magasin A existe déjà : ${testData.orgA.storeName}`)
  }

  const existingStoreB = await prisma.store.findFirst({
    where: { name: testData.orgB.storeName },
  })
  if (existingStoreB) {
    conflicts.push(`Magasin B existe déjà : ${testData.orgB.storeName}`)
  }

  // Vérifier les catégories
  const existingCategoryA = await prisma.category.findFirst({
    where: { name: testData.categoryA },
  })
  if (existingCategoryA) {
    conflicts.push(`Catégorie A existe déjà : ${testData.categoryA}`)
  }

  const existingCategoryB = await prisma.category.findFirst({
    where: { name: testData.categoryB },
  })
  if (existingCategoryB) {
    conflicts.push(`Catégorie B existe déjà : ${testData.categoryB}`)
  }

  // Vérifier les marques
  const existingBrandA = await prisma.brand.findFirst({
    where: { name: testData.brandA },
  })
  if (existingBrandA) {
    conflicts.push(`Marque A existe déjà : ${testData.brandA}`)
  }

  const existingBrandB = await prisma.brand.findFirst({
    where: { name: testData.brandB },
  })
  if (existingBrandB) {
    conflicts.push(`Marque B existe déjà : ${testData.brandB}`)
  }

  // Vérifier les produits et SKU
  const existingProductA = await prisma.product.findFirst({
    where: { sku: testData.skuA },
  })
  if (existingProductA) {
    conflicts.push(`Produit A existe déjà (SKU) : ${testData.skuA}`)
  }

  const existingProductB = await prisma.product.findFirst({
    where: { sku: testData.skuB },
  })
  if (existingProductB) {
    conflicts.push(`Produit B existe déjà (SKU) : ${testData.skuB}`)
  }

  // Vérifier les fournisseurs
  const existingSupplierA = await prisma.supplier.findFirst({
    where: { name: testData.supplierA },
  })
  if (existingSupplierA) {
    conflicts.push(`Fournisseur A existe déjà : ${testData.supplierA}`)
  }

  const existingSupplierB = await prisma.supplier.findFirst({
    where: { name: testData.supplierB },
  })
  if (existingSupplierB) {
    conflicts.push(`Fournisseur B existe déjà : ${testData.supplierB}`)
  }

  // Vérifier les clients
  const existingCustomerA = await prisma.customer.findFirst({
    where: { name: testData.customerA },
  })
  if (existingCustomerA) {
    conflicts.push(`Client A existe déjà : ${testData.customerA}`)
  }

  const existingCustomerB = await prisma.customer.findFirst({
    where: { name: testData.customerB },
  })
  if (existingCustomerB) {
    conflicts.push(`Client B existe déjà : ${testData.customerB}`)
  }

  if (conflicts.length > 0) {
    console.error('❌ Conflits détectés :')
    conflicts.forEach(conflict => console.error(`  - ${conflict}`))
    console.error('\nRefus de créer les données de test.')
    console.error('Nettoyez d\'abord les données existantes avec :')
    console.error(`  npx tsx scripts/cleanup-test-data.ts ${campaignId}`)
    process.exit(1)
  }

  console.log('✓ Aucun conflit détecté')
}

async function createTestData(campaignId: string) {
  const testData = getTestData(campaignId)

  // Vérifier les conflits avant toute création
  await checkConflicts(campaignId, testData)

  console.log(`\n=== Création des données de test pour ${campaignId} ===\n`)

  // Transaction atomique pour la création des deux organisations
  const result = await prisma.$transaction(async (tx) => {
    // Créer Organisation A
    const orgA = await tx.organization.create({
      data: { name: testData.orgA.name },
    })
    console.log(`✓ Organisation A créée : ${orgA.name}`)

    // Créer User A
    const bcrypt = require('bcryptjs')
    const passwordHashA = await bcrypt.hash(testData.orgA.password, 10)
    const userA = await tx.user.create({
      data: {
        email: testData.orgA.email,
        name: 'Test User A',
        passwordHash: passwordHashA,
        organizationId: orgA.id,
        active: true,
        // role: Laisser la valeur par défaut (EMPLOYEE)
      },
    })
    console.log(`✓ User A créé : ${userA.email}`)

    // Créer Store A
    const storeA = await tx.store.create({
      data: {
        name: testData.orgA.storeName,
        organizationId: orgA.id,
      },
    })
    console.log(`✓ Store A créé : ${storeA.name}`)

    // Créer StoreMember A avec rôle OWNER
    const storeMemberA = await tx.storeMember.create({
      data: {
        userId: userA.id,
        storeId: storeA.id,
        role: 'OWNER',
      },
    })
    console.log(`✓ StoreMember A créé (role: OWNER)`)

    // Créer données métier pour Store A
    const categoryA = await tx.category.create({
      data: {
        name: testData.categoryA,
        storeId: storeA.id,
      },
    })
    console.log(`✓ Catégorie A créée : ${categoryA.name}`)

    const brandA = await tx.brand.create({
      data: {
        name: testData.brandA,
        storeId: storeA.id,
      },
    })
    console.log(`✓ Marque A créée : ${brandA.name}`)

    const productA = await tx.product.create({
      data: {
        name: testData.productA,
        sku: testData.skuA,
        storeId: storeA.id,
        categoryId: categoryA.id,
        brandId: brandA.id,
        purchasePrice: 100,
        sellingPrice: 150,
        stock: 10,
      },
    })
    console.log(`✓ Produit A créé : ${productA.name} (SKU: ${productA.sku})`)

    const supplierA = await tx.supplier.create({
      data: {
        name: testData.supplierA,
        email: `supplier_a_${campaignId}@test.com`,
        phone: '1234567890',
        storeId: storeA.id,
      },
    })
    console.log(`✓ Fournisseur A créé : ${supplierA.name}`)

    const customerA = await tx.customer.create({
      data: {
        name: testData.customerA,
        email: `customer_a_${campaignId}@test.com`,
        phone: '0987654321',
        storeId: storeA.id,
      },
    })
    console.log(`✓ Client A créé : ${customerA.name}`)

    // Créer Organisation B
    const orgB = await tx.organization.create({
      data: { name: testData.orgB.name },
    })
    console.log(`✓ Organisation B créée : ${orgB.name}`)

    // Créer User B
    const passwordHashB = await bcrypt.hash(testData.orgB.password, 10)
    const userB = await tx.user.create({
      data: {
        email: testData.orgB.email,
        name: 'Test User B',
        passwordHash: passwordHashB,
        organizationId: orgB.id,
        active: true,
        // role: Laisser la valeur par défaut (EMPLOYEE)
      },
    })
    console.log(`✓ User B créé : ${userB.email}`)

    // Créer Store B
    const storeB = await tx.store.create({
      data: {
        name: testData.orgB.storeName,
        organizationId: orgB.id,
      },
    })
    console.log(`✓ Store B créé : ${storeB.name}`)

    // Créer StoreMember B avec rôle OWNER
    const storeMemberB = await tx.storeMember.create({
      data: {
        userId: userB.id,
        storeId: storeB.id,
        role: 'OWNER',
      },
    })
    console.log(`✓ StoreMember B créé (role: OWNER)`)

    // Créer données métier pour Store B
    const categoryB = await tx.category.create({
      data: {
        name: testData.categoryB,
        storeId: storeB.id,
      },
    })
    console.log(`✓ Catégorie B créée : ${categoryB.name}`)

    const brandB = await tx.brand.create({
      data: {
        name: testData.brandB,
        storeId: storeB.id,
      },
    })
    console.log(`✓ Marque B créée : ${brandB.name}`)

    const productB = await tx.product.create({
      data: {
        name: testData.productB,
        sku: testData.skuB,
        storeId: storeB.id,
        categoryId: categoryB.id,
        brandId: brandB.id,
        purchasePrice: 200,
        sellingPrice: 300,
        stock: 20,
      },
    })
    console.log(`✓ Produit B créé : ${productB.name} (SKU: ${productB.sku})`)

    const supplierB = await tx.supplier.create({
      data: {
        name: testData.supplierB,
        email: `supplier_b_${campaignId}@test.com`,
        phone: '1234567890',
        storeId: storeB.id,
      },
    })
    console.log(`✓ Fournisseur B créé : ${supplierB.name}`)

    const customerB = await tx.customer.create({
      data: {
        name: testData.customerB,
        email: `customer_b_${campaignId}@test.com`,
        phone: '0987654321',
        storeId: storeB.id,
      },
    })
    console.log(`✓ Client B créé : ${customerB.name}`)

    console.log('\n=== Données de test créées avec succès ===\n')

    return {
      orgA,
      userA,
      storeA,
      storeMemberA,
      orgB,
      userB,
      storeB,
      storeMemberB,
      categoryA,
      brandA,
      productA,
      supplierA,
      customerA,
      categoryB,
      brandB,
      productB,
      supplierB,
      customerB,
    }
  })

  return result
}

async function main() {
  const args = process.argv.slice(2)
  const campaignId = args[0]

  if (!campaignId) {
    console.error('Usage: npx tsx scripts/test-registration.ts <CAMPAIGN_ID>')
    console.error('\nExemple :')
    console.error('  npx tsx scripts/test-registration.ts STOCKLY_TEST_RUN_20261111')
    process.exit(1)
  }

  // Valider le format de l'identifiant de campagne
  if (!validateCampaignId(campaignId)) {
    console.error('\n❌ ERREUR : Identifiant de campagne invalide')
    console.error('L\'identifiant doit contenir au moins 10 caractères alphanumériques, tirets, underscores ou espaces.')
    process.exit(1)
  }

  console.log('==========================================')
  console.log('CRÉATION DE DONNÉES DE TEST')
  console.log('==========================================')
  console.log(`Campagne : ${campaignId}\n`)

  const data = await createTestData(campaignId)

  console.log('\n=== Résumé ===')
  console.log('Organisations : 2')
  console.log('Utilisateurs : 2')
  console.log('Magasins : 2')
  console.log('Catégories : 2')
  console.log('Marques : 2')
  console.log('Produits : 2')
  console.log('Fournisseurs : 2')
  console.log('Clients : 2')
  console.log('\nPour nettoyer ces données, exécutez :')
  console.log(`  npx tsx scripts/cleanup-test-data.ts ${campaignId}`)
  console.log(`  npx tsx scripts/cleanup-test-data.ts ${campaignId} ${campaignId}  # Pour confirmer`)
}

main()
  .then(() => {
    console.log('Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Erreur lors de la création des données de test:', error)
    process.exit(1)
  })
  .finally(() => {
    pool.end()
  })
