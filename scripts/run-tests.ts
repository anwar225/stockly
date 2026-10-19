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

// IDs des données de test (à mettre à jour après exécution de prepare-test-data.ts)
const TEST_DATA = {
  storeId: 'cmu2w7n33000138tyye6uawj3',
  supplierId: 'cmv9u6dhb0000astyg600613a',
  customerId: 'cmv9u6dk10001astyptbjdxeq',
  productId: 'cmv9u6drt0004asty2qtb1ek9', // stock=10
  productLowStockId: 'cmv9u6duk0005astyv2rjku65', // stock=3
  productMovementId: 'cmv9u6dxc0006astygser0gw7', // stock=2
}

const BASE_URL = 'http://localhost:3000'

// Fonction helper pour les requêtes API
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: any }> {
  const url = `${BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  let data
  try {
    data = await response.json()
  } catch {
    data = await response.text()
  }

  return { status: response.status, data }
}

// Fonction pour obtenir un cookie de session (simulée - nécessite auth manuelle)
// Pour les tests réels, l'utilisateur doit se connecter via le navigateur et copier le cookie
async function getAuthCookie(): Promise<string> {
  // Note: Ceci est une simulation. En pratique, l'utilisateur doit:
  // 1. Se connecter sur http://localhost:3000/login
  // 2. Ouvrir les DevTools (F12)
  // 3. Aller dans Application > Cookies
  // 4. Copier la valeur du cookie 'next-auth.session-token'
  throw new Error('Authentification requise: Veuillez vous connecter et fournir le cookie')
}

// ============================================================================
// TEST 1: Réception d'achat avec double requête
// ============================================================================
async function test1_doubleReceive() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 1: Réception d\'achat avec double requête')
  console.log('='.repeat(60))

  try {
    // Étape 1: Créer un achat DRAFT
    console.log('\n📝 Étape 1: Création d\'un achat DRAFT...')
    const createResponse = await apiRequest('/api/purchases', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: TEST_DATA.supplierId,
        purchaseDate: new Date().toISOString(),
        items: [
          {
            productId: TEST_DATA.productId,
            quantity: 5,
            unitPrice: 100,
          },
        ],
      }),
    })

    console.log(`Status: ${createResponse.status}`)
    if (createResponse.status !== 201) {
      console.log('❌ Échec de la création de l\'achat')
      console.log('Data:', createResponse.data)
      return { test: 'TEST1', status: 'FAIL', reason: 'Échec création achat' }
    }

    const purchase = createResponse.data
    console.log(`✅ Achat créé: ${purchase.reference} (ID: ${purchase.id}, Status: ${purchase.status})`)

    // Étape 2: Commander l'achat
    console.log('\n📦 Étape 2: Commande de l\'achat...')
    const orderResponse = await apiRequest(`/api/purchases/${purchase.id}/order`, {
      method: 'POST',
    })

    console.log(`Status: ${orderResponse.status}`)
    if (orderResponse.status !== 200) {
      console.log('❌ Échec de la commande')
      console.log('Data:', orderResponse.data)
      return { test: 'TEST1', status: 'FAIL', reason: 'Échec commande achat' }
    }

    console.log(`✅ Achat commandé (Status: ${orderResponse.data.status})`)

    // Étape 3: Récupérer le stock initial
    const productBefore = await prisma.product.findUnique({
      where: { id: TEST_DATA.productId },
      select: { stock: true },
    })
    console.log(`\n📊 Stock initial: ${productBefore?.stock}`)

    // Étape 4: Première réception
    console.log('\n📥 Étape 4: Première réception...')
    const receive1Response = await apiRequest(`/api/purchases/${purchase.id}/receive`, {
      method: 'POST',
    })

    console.log(`Status: ${receive1Response.status}`)
    if (receive1Response.status !== 200) {
      console.log('❌ Échec de la première réception')
      console.log('Data:', receive1Response.data)
      return { test: 'TEST1', status: 'FAIL', reason: 'Échec première réception' }
    }

    console.log(`✅ Première réception réussie (Status: ${receive1Response.data.status})`)

    // Étape 5: Vérifier le stock après première réception
    const productAfter1 = await prisma.product.findUnique({
      where: { id: TEST_DATA.productId },
      select: { stock: true },
    })
    console.log(`📊 Stock après 1ère réception: ${productAfter1?.stock}`)

    // Étape 6: Deuxième réception (doit échouer)
    console.log('\n📥 Étape 5: Deuxième réception (doit échouer)...')
    const receive2Response = await apiRequest(`/api/purchases/${purchase.id}/receive`, {
      method: 'POST',
    })

    console.log(`Status: ${receive2Response.status}`)
    if (receive2Response.status !== 400) {
      console.log('❌ La deuxième réception aurait dû échouer avec 400')
      console.log('Data:', receive2Response.data)
      return { test: 'TEST1', status: 'FAIL', reason: 'Deuxième réception non bloquée' }
    }

    console.log(`✅ Deuxième réception correctement bloquée`)
    console.log(`Message: ${receive2Response.data.error}`)

    // Étape 7: Vérifier le stock final
    const productAfter2 = await prisma.product.findUnique({
      where: { id: TEST_DATA.productId },
      select: { stock: true },
    })
    console.log(`📊 Stock final: ${productAfter2?.stock}`)

    const expectedStock = (productBefore?.stock || 0) + 5
    if (productAfter2?.stock !== expectedStock) {
      console.log(`❌ Stock incorrect: attendu ${expectedStock}, obtenu ${productAfter2?.stock}`)
      return { test: 'TEST1', status: 'FAIL', reason: 'Stock incorrect après double réception' }
    }

    console.log(`✅ Stock correct: ${productAfter2?.stock} = ${productBefore?.stock} + 5`)

    return { test: 'TEST1', status: 'PASS' }
  } catch (error) {
    console.error('❌ Erreur:', error)
    return { test: 'TEST1', status: 'FAIL', reason: String(error) }
  }
}

// ============================================================================
// TEST 2: Confirmation de vente avec stock insuffisant
// ============================================================================
async function test2_insufficientStock() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 2: Confirmation de vente avec stock insuffisant')
  console.log('='.repeat(60))

  try {
    // Étape 1: Récupérer le stock initial
    const productBefore = await prisma.product.findUnique({
      where: { id: TEST_DATA.productLowStockId },
      select: { stock: true },
    })
    console.log(`📊 Stock initial: ${productBefore?.stock}`)

    // Étape 2: Créer une vente DRAFT avec quantité > stock
    console.log('\n📝 Étape 2: Création d\'une vente DRAFT (quantité=5, stock=3)...')
    const createResponse = await apiRequest('/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        customerId: TEST_DATA.customerId,
        saleDate: new Date().toISOString(),
        items: [
          {
            productId: TEST_DATA.productLowStockId,
            quantity: 5,
            unitPrice: 75,
          },
        ],
      }),
    })

    console.log(`Status: ${createResponse.status}`)
    if (createResponse.status !== 201) {
      console.log('❌ Échec de la création de la vente')
      console.log('Data:', createResponse.data)
      return { test: 'TEST2', status: 'FAIL', reason: 'Échec création vente' }
    }

    const sale = createResponse.data
    console.log(`✅ Vente créée: ${sale.reference} (ID: ${sale.id}, Status: ${sale.status})`)

    // Étape 3: Confirmer la vente (doit échouer)
    console.log('\n✅ Étape 3: Confirmation de la vente (doit échouer)...')
    const confirmResponse = await apiRequest(`/api/sales/${sale.id}/confirm`, {
      method: 'POST',
    })

    console.log(`Status: ${confirmResponse.status}`)
    if (confirmResponse.status !== 409) {
      console.log('❌ La confirmation aurait dû échouer avec 409')
      console.log('Data:', confirmResponse.data)
      return { test: 'TEST2', status: 'FAIL', reason: 'Confirmation non bloquée' }
    }

    console.log(`✅ Confirmation correctement bloquée`)
    console.log(`Message: ${confirmResponse.data.error}`)

    // Étape 4: Vérifier que le stock n'a pas changé
    const productAfter = await prisma.product.findUnique({
      where: { id: TEST_DATA.productLowStockId },
      select: { stock: true },
    })
    console.log(`📊 Stock final: ${productAfter?.stock}`)

    if (productAfter?.stock !== productBefore?.stock) {
      console.log(`❌ Stock modifié: attendu ${productBefore?.stock}, obtenu ${productAfter?.stock}`)
      return { test: 'TEST2', status: 'FAIL', reason: 'Stock modifié malgré erreur' }
    }

    console.log(`✅ Stock inchangé: ${productAfter?.stock}`)

    return { test: 'TEST2', status: 'PASS' }
  } catch (error) {
    console.error('❌ Erreur:', error)
    return { test: 'TEST2', status: 'FAIL', reason: String(error) }
  }
}

// ============================================================================
// TEST 3: Confirmation de vente avec double requête
// ============================================================================
async function test3_doubleConfirm() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 3: Confirmation de vente avec double requête')
  console.log('='.repeat(60))

  try {
    // Étape 1: Récupérer le stock initial
    const productBefore = await prisma.product.findUnique({
      where: { id: TEST_DATA.productId },
      select: { stock: true },
    })
    console.log(`📊 Stock initial: ${productBefore?.stock}`)

    // Étape 2: Créer une vente DRAFT
    console.log('\n📝 Étape 2: Création d\'une vente DRAFT...')
    const createResponse = await apiRequest('/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        customerId: TEST_DATA.customerId,
        saleDate: new Date().toISOString(),
        items: [
          {
            productId: TEST_DATA.productId,
            quantity: 3,
            unitPrice: 150,
          },
        ],
      }),
    })

    console.log(`Status: ${createResponse.status}`)
    if (createResponse.status !== 201) {
      console.log('❌ Échec de la création de la vente')
      console.log('Data:', createResponse.data)
      return { test: 'TEST3', status: 'FAIL', reason: 'Échec création vente' }
    }

    const sale = createResponse.data
    console.log(`✅ Vente créée: ${sale.reference} (ID: ${sale.id}, Status: ${sale.status})`)

    // Étape 3: Première confirmation
    console.log('\n✅ Étape 3: Première confirmation...')
    const confirm1Response = await apiRequest(`/api/sales/${sale.id}/confirm`, {
      method: 'POST',
    })

    console.log(`Status: ${confirm1Response.status}`)
    if (confirm1Response.status !== 200) {
      console.log('❌ Échec de la première confirmation')
      console.log('Data:', confirm1Response.data)
      return { test: 'TEST3', status: 'FAIL', reason: 'Échec première confirmation' }
    }

    console.log(`✅ Première confirmation réussie (Status: ${confirm1Response.data.status})`)

    // Étape 4: Vérifier le stock après première confirmation
    const productAfter1 = await prisma.product.findUnique({
      where: { id: TEST_DATA.productId },
      select: { stock: true },
    })
    console.log(`📊 Stock après 1ère confirmation: ${productAfter1?.stock}`)

    // Étape 5: Deuxième confirmation (doit échouer)
    console.log('\n✅ Étape 5: Deuxième confirmation (doit échouer)...')
    const confirm2Response = await apiRequest(`/api/sales/${sale.id}/confirm`, {
      method: 'POST',
    })

    console.log(`Status: ${confirm2Response.status}`)
    if (confirm2Response.status !== 409) {
      console.log('❌ La deuxième confirmation aurait dû échouer avec 409')
      console.log('Data:', confirm2Response.data)
      return { test: 'TEST3', status: 'FAIL', reason: 'Deuxième confirmation non bloquée' }
    }

    console.log(`✅ Deuxième confirmation correctement bloquée`)
    console.log(`Message: ${confirm2Response.data.error}`)

    // Étape 6: Vérifier le stock final
    const productAfter2 = await prisma.product.findUnique({
      where: { id: TEST_DATA.productId },
      select: { stock: true },
    })
    console.log(`📊 Stock final: ${productAfter2?.stock}`)

    const expectedStock = (productBefore?.stock || 0) - 3
    if (productAfter2?.stock !== expectedStock) {
      console.log(`❌ Stock incorrect: attendu ${expectedStock}, obtenu ${productAfter2?.stock}`)
      return { test: 'TEST3', status: 'FAIL', reason: 'Stock incorrect après double confirmation' }
    }

    console.log(`✅ Stock correct: ${productAfter2?.stock} = ${productBefore?.stock} - 3`)

    return { test: 'TEST3', status: 'PASS' }
  } catch (error) {
    console.error('❌ Erreur:', error)
    return { test: 'TEST3', status: 'FAIL', reason: String(error) }
  }
}

// ============================================================================
// TEST 4: Permissions RBAC - Achats (EMPLOYEE)
// ============================================================================
async function test4_employeePurchases() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 4: Permissions RBAC - Achats (EMPLOYEE)')
  console.log('='.repeat(60))

  console.log('\n⚠️  Ce test nécessite une authentification avec le compte EMPLOYEE')
  console.log('   Email: employee-test@stockly.ma')
  console.log('   Password: EmployeeTest123!')
  console.log('   Veuillez vous connecter et fournir le cookie de session')
  console.log('\n⏭️  PASS ce test pour l\'instant (nécessite intervention manuelle)')

  return { test: 'TEST4', status: 'NOT_TESTED', reason: 'Nécessite authentification manuelle' }
}

// ============================================================================
// TEST 5: Permissions RBAC - Ventes (EMPLOYEE)
// ============================================================================
async function test5_employeeSales() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 5: Permissions RBAC - Ventes (EMPLOYEE)')
  console.log('='.repeat(60))

  console.log('\n⚠️  Ce test nécessite une authentification avec le compte EMPLOYEE')
  console.log('   Email: employee-test@stockly.ma')
  console.log('   Password: EmployeeTest123!')
  console.log('   Veuillez vous connecter et fournir le cookie de session')
  console.log('\n⏭️  PASS ce test pour l\'instant (nécessite intervention manuelle)')

  return { test: 'TEST5', status: 'NOT_TESTED', reason: 'Nécessite authentification manuelle' }
}

// ============================================================================
// TEST 6: Mouvement OUT avec stock insuffisant
// ============================================================================
async function test6_movementOutInsufficient() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 6: Mouvement OUT avec stock insuffisant')
  console.log('='.repeat(60))

  try {
    // Étape 1: Récupérer le stock initial
    const productBefore = await prisma.product.findUnique({
      where: { id: TEST_DATA.productMovementId },
      select: { stock: true },
    })
    console.log(`📊 Stock initial: ${productBefore?.stock}`)

    // Étape 2: Créer un mouvement OUT avec quantité > stock
    console.log('\n📝 Étape 2: Création d\'un mouvement OUT (quantité=5, stock=2)...')
    const createResponse = await apiRequest('/api/movements', {
      method: 'POST',
      body: JSON.stringify({
        productId: TEST_DATA.productMovementId,
        type: 'OUT',
        quantity: 5,
        reason: 'TEST-Mouvement OUT',
      }),
    })

    console.log(`Status: ${createResponse.status}`)
    if (createResponse.status !== 409) {
      console.log('❌ Le mouvement aurait dû échouer avec 409')
      console.log('Data:', createResponse.data)
      return { test: 'TEST6', status: 'FAIL', reason: 'Mouvement non bloqué' }
    }

    console.log(`✅ Mouvement correctement bloqué`)
    console.log(`Message: ${createResponse.data.error}`)

    // Étape 3: Vérifier que le stock n'a pas changé
    const productAfter = await prisma.product.findUnique({
      where: { id: TEST_DATA.productMovementId },
      select: { stock: true },
    })
    console.log(`📊 Stock final: ${productAfter?.stock}`)

    if (productAfter?.stock !== productBefore?.stock) {
      console.log(`❌ Stock modifié: attendu ${productBefore?.stock}, obtenu ${productAfter?.stock}`)
      return { test: 'TEST6', status: 'FAIL', reason: 'Stock modifié malgré erreur' }
    }

    console.log(`✅ Stock inchangé: ${productAfter?.stock}`)

    return { test: 'TEST6', status: 'PASS' }
  } catch (error) {
    console.error('❌ Erreur:', error)
    return { test: 'TEST6', status: 'FAIL', reason: String(error) }
  }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('🧪 DÉMARRAGE DES TESTS DU MVP STOCKLY')
  console.log(`URL de base: ${BASE_URL}`)
  console.log('='.repeat(60))

  const results = []

  // Exécuter les tests
  results.push(await test1_doubleReceive())
  results.push(await test2_insufficientStock())
  results.push(await test3_doubleConfirm())
  results.push(await test4_employeePurchases())
  results.push(await test5_employeeSales())
  results.push(await test6_movementOutInsufficient())

  // Afficher le tableau de résultats
  console.log('\n' + '='.repeat(60))
  console.log('📊 TABLEAU DES RÉSULTATS')
  console.log('='.repeat(60))
  console.log('| Test       | Statut      | Raison                           |')
  console.log('|------------|-------------|----------------------------------|')
  for (const result of results) {
    const status = result.status.padEnd(12)
    const reason = (result.reason || '-').padEnd(32)
    console.log(`| ${result.test.padEnd(10)} | ${status} | ${reason} |`)
  }
  console.log('='.repeat(60))

  // Compter les résultats
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const notTested = results.filter(r => r.status === 'NOT_TESTED').length

  console.log(`\n✅ PASS: ${passed}`)
  console.log(`❌ FAIL: ${failed}`)
  console.log(`⏭️  NOT_TESTED: ${notTested}`)
  console.log(`📦 TOTAL: ${results.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
