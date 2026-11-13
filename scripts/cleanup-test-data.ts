import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

interface CleanupSummary {
  organizations: Array<{ id: string; name: string }>
  users: Array<{ id: string; email: string; organizationId: string }>
  stores: Array<{ id: string; name: string; organizationId: string }>
  storeMembers: Array<{ id: string; userId: string; storeId: string }>
  products: number
  categories: number
  brands: number
  suppliers: number
  customers: number
  purchases: number
  purchaseItems: number
  sales: number
  saleItems: number
  invoices: number
  payments: number
  stockMovements: number
  blockingDependencies: Array<{ type: string; id: string; name: string; storeId?: string }>
}

function validateCampaignId(campaignId: string): boolean {
  // L'identifiant de campagne doit être alphanumérique avec tirets, underscores et espaces
  const pattern = /^[a-zA-Z0-9_\- ]+$/
  return pattern.test(campaignId) && campaignId.length >= 10
}

async function getCleanupSummary(campaignId: string): Promise<CleanupSummary> {
  console.log(`\n=== Analyse des données pour la campagne : ${campaignId} ===\n`)

  // Construire les noms exacts des organisations attendues
  const expectedOrgNames = [
    `TEST_ORG_A_${campaignId}`,
    `TEST_ORG_B_${campaignId}`,
  ]

  console.log('Organisations attendues :')
  expectedOrgNames.forEach(name => console.log(`  - ${name}`))

  // Rechercher les organisations avec les noms exacts
  const organizations = await prisma.organization.findMany({
    where: {
      name: {
        in: expectedOrgNames,
      },
    },
    select: {
      id: true,
      name: true,
    },
  })

  if (organizations.length === 0) {
    console.log('✓ Aucune organisation trouvée pour cette campagne')
    return {
      organizations: [],
      users: [],
      stores: [],
      storeMembers: [],
      products: 0,
      categories: 0,
      brands: 0,
      suppliers: 0,
      customers: 0,
      purchases: 0,
      purchaseItems: 0,
      sales: 0,
      saleItems: 0,
      invoices: 0,
      payments: 0,
      stockMovements: 0,
      blockingDependencies: [],
    }
  }

  // Vérifier que toutes les organisations trouvées sont dans la liste attendue
  const unexpectedOrgs = organizations.filter(org => !expectedOrgNames.includes(org.name))
  if (unexpectedOrgs.length > 0) {
    console.error('\n⚠️ ATTENTION : Organisations inattendues trouvées :')
    unexpectedOrgs.forEach(org => {
      console.error(`  - ${org.name} (${org.id})`)
    })
    console.error('Refus de procéder par sécurité.')
    process.exit(1)
  }

  // Vérifier que toutes les organisations attendues sont présentes
  const missingOrgs = expectedOrgNames.filter(name => !organizations.find(org => org.name === name))
  if (missingOrgs.length > 0) {
    console.error('\n❌ ERREUR : Organisations attendues manquantes :')
    missingOrgs.forEach(name => console.error(`  - ${name}`))
    console.error('Refus de procéder par sécurité.')
    console.error('Le nettoyage doit être complet. Supprimez toutes les organisations de la campagne.')
    process.exit(1)
  }

  console.log(`\nOrganisations trouvées : ${organizations.length}`)
  organizations.forEach(org => {
    console.log(`  - ${org.name} (${org.id})`)
  })

  const organizationIds = organizations.map(o => o.id)

  // Identifier les utilisateurs de ces organisations
  const users = await prisma.user.findMany({
    where: {
      organizationId: { in: organizationIds },
    },
    select: {
      id: true,
      email: true,
      organizationId: true,
    },
  })

  console.log(`\nUtilisateurs trouvés : ${users.length}`)
  users.forEach(user => {
    console.log(`  - ${user.email} (${user.id})`)
  })

  // Vérifier que chaque utilisateur n'appartient qu'à une organisation ciblée
  for (const user of users) {
    if (!organizationIds.includes(user.organizationId)) {
      console.error(`\n❌ ERREUR : L'utilisateur ${user.email} appartient à une organisation hors campagne (${user.organizationId})`)
      console.error('Refus de procéder par sécurité.')
      process.exit(1)
    }
  }

  // Identifier les magasins de ces organisations
  const stores = await prisma.store.findMany({
    where: {
      organizationId: { in: organizationIds },
    },
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  })

  console.log(`\nMagasins trouvés : ${stores.length}`)
  stores.forEach(store => {
    console.log(`  - ${store.name} (${store.id})`)
  })

  const storeIds = stores.map(s => s.id)

  // Identifier les StoreMember
  const storeMembers = await prisma.storeMember.findMany({
    where: {
      userId: { in: users.map(u => u.id) },
    },
    select: {
      id: true,
      userId: true,
      storeId: true,
    },
  })

  console.log(`\nStoreMembers trouvés : ${storeMembers.length}`)

  // Vérifier que chaque StoreMember pointe vers un magasin ciblé
  for (const member of storeMembers) {
    if (!storeIds.includes(member.storeId)) {
      console.error(`\n❌ ERREUR : StoreMember ${member.id} pointe vers un magasin hors campagne (${member.storeId})`)
      console.error('Refus de procéder par sécurité.')
      process.exit(1)
    }
  }

  // Vérification supplémentaire : s'assurer que TOUS les StoreMember de chaque utilisateur sont inclus
  for (const user of users) {
    const allUserStoreMembers = await prisma.storeMember.findMany({
      where: { userId: user.id },
      select: { id: true, storeId: true },
    })

    const userStoreMembers = storeMembers.filter(sm => sm.userId === user.id)

    if (allUserStoreMembers.length !== userStoreMembers.length) {
      console.error(`\n❌ ERREUR : L'utilisateur ${user.email} a des StoreMember non inclus dans la vérification`)
      console.error(`  StoreMember trouvés : ${userStoreMembers.length}`)
      console.error(`  StoreMember totaux : ${allUserStoreMembers.length}`)
      console.error('Refus de procéder par sécurité.')
      process.exit(1)
    }
  }

  // Compter les données liées aux magasins
  const products = await prisma.product.count({
    where: { storeId: { in: storeIds } },
  })

  const categories = await prisma.category.count({
    where: { storeId: { in: storeIds } },
  })

  const brands = await prisma.brand.count({
    where: { storeId: { in: storeIds } },
  })

  const suppliers = await prisma.supplier.count({
    where: { storeId: { in: storeIds } },
  })

  const customers = await prisma.customer.count({
    where: { storeId: { in: storeIds } },
  })

  const purchases = await prisma.purchase.count({
    where: { storeId: { in: storeIds } },
  })

  const purchaseItems = await prisma.purchaseItem.count({
    where: {
      purchase: {
        storeId: { in: storeIds },
      },
    },
  })

  const sales = await prisma.sale.count({
    where: { storeId: { in: storeIds } },
  })

  const saleItems = await prisma.saleItem.count({
    where: {
      sale: {
        storeId: { in: storeIds },
      },
    },
  })

  const invoices = await prisma.invoice.count({
    where: { storeId: { in: storeIds } },
  })

  const payments = await prisma.payment.count({
    where: { storeId: { in: storeIds } },
  })

  const stockMovements = await prisma.stockMovement.count({
    where: { storeId: { in: storeIds } },
  })

  console.log('\nDonnées liées :')
  console.log(`  - Produits : ${products}`)
  console.log(`  - Catégories : ${categories}`)
  console.log(`  - Marques : ${brands}`)
  console.log(`  - Fournisseurs : ${suppliers}`)
  console.log(`  - Clients : ${customers}`)
  console.log(`  - Achats : ${purchases}`)
  console.log(`  - Éléments d'achat : ${purchaseItems}`)
  console.log(`  - Ventes : ${sales}`)
  console.log(`  - Éléments de vente : ${saleItems}`)
  console.log(`  - Factures : ${invoices}`)
  console.log(`  - Paiements : ${payments}`)
  console.log(`  - Mouvements de stock : ${stockMovements}`)

  // Vérifier les dépendances bloquantes (onDelete: Restrict)
  const blockingDependencies: Array<{ type: string; id: string; name: string }> = []

  if (purchases > 0) {
    const blockingPurchases = await prisma.purchase.findMany({
      where: { storeId: { in: storeIds } },
      select: { id: true, reference: true },
      take: 5,
    })
    blockingPurchases.forEach(p => {
      blockingDependencies.push({ type: 'Purchase', id: p.id, name: p.reference })
    })
  }

  if (sales > 0) {
    const blockingSales = await prisma.sale.findMany({
      where: { storeId: { in: storeIds } },
      select: { id: true, reference: true },
      take: 5,
    })
    blockingSales.forEach(s => {
      blockingDependencies.push({ type: 'Sale', id: s.id, name: s.reference })
    })
  }

  if (invoices > 0) {
    const blockingInvoices = await prisma.invoice.findMany({
      where: { storeId: { in: storeIds } },
      select: { id: true, reference: true },
      take: 5,
    })
    blockingInvoices.forEach(i => {
      blockingDependencies.push({ type: 'Invoice', id: i.id, name: i.reference })
    })
  }

  if (payments > 0) {
    const blockingPayments = await prisma.payment.findMany({
      where: { storeId: { in: storeIds } },
      select: { id: true, reference: true },
      take: 5,
    })
    blockingPayments.forEach(p => {
      blockingDependencies.push({ type: 'Payment', id: p.id, name: p.reference || p.id })
    })
  }

  if (blockingDependencies.length > 0) {
    console.error('\n⚠️ ATTENTION : Dépendances bloquantes détectées (onDelete: Restrict) :')
    blockingDependencies.forEach(dep => {
      console.error(`  - ${dep.type} : ${dep.name} (${dep.id})`)
    })
    console.error('\nCes données empêchent la suppression par cascade.')
    console.error('Supprimez-les manuellement avant de procéder au nettoyage.')
    console.error('Refus de procéder par sécurité.')
    process.exit(1)
  }

  // Vérification supplémentaire : PurchaseItem et SaleItem (onDelete: Restrict sur Product)
  if (purchaseItems > 0) {
    console.error('\n⚠️ ATTENTION : Éléments d\'achat (PurchaseItem) détectés')
    console.error('Ces données empêchent la suppression par cascade (onDelete: Restrict sur Product).')
    console.error('Refus de procéder par sécurité.')
    process.exit(1)
  }

  if (saleItems > 0) {
    console.error('\n⚠️ ATTENTION : Éléments de vente (SaleItem) détectés')
    console.error('Ces données empêchent la suppression par cascade (onDelete: Restrict sur Product).')
    console.error('Refus de procéder par sécurité.')
    process.exit(1)
  }

  return {
    organizations,
    users,
    stores,
    storeMembers: storeMembers.map(sm => ({
      id: sm.id,
      userId: sm.userId,
      storeId: sm.storeId,
    })),
    products,
    categories,
    brands,
    suppliers,
    customers,
    purchases,
    purchaseItems,
    sales,
    saleItems,
    invoices,
    payments,
    stockMovements,
    blockingDependencies,
  }
}

async function executeCleanup(summary: CleanupSummary, campaignId: string, confirmedCampaignId: string) {
  if (confirmedCampaignId !== campaignId) {
    console.error('\n❌ ERREUR : L\'identifiant de campagne confirmé ne correspond pas')
    console.error(`Attendu : ${campaignId}`)
    console.error(`Reçu : ${confirmedCampaignId}`)
    process.exit(1)
  }

  console.log('\n=== Suppression des données ===\n')

  const organizationIds = summary.organizations.map(o => o.id)

  // Transaction atomique pour la suppression
  await prisma.$transaction(async (tx) => {
    // Supprimer les StoreMember
    await tx.storeMember.deleteMany({
      where: {
        userId: { in: summary.users.map(u => u.id) },
      },
    })
    console.log(`✓ ${summary.storeMembers.length} StoreMember(s) supprimé(s)`)

    // Supprimer les utilisateurs
    await tx.user.deleteMany({
      where: {
        id: { in: summary.users.map(u => u.id) },
      },
    })
    console.log(`✓ ${summary.users.length} utilisateur(s) supprimé(s)`)

    // Supprimer les organisations (cascade supprimera tout le reste)
    await tx.organization.deleteMany({
      where: {
        id: { in: organizationIds },
      },
    })
    console.log(`✓ ${summary.organizations.length} organisation(s) supprimée(s)`)
    console.log('  (Les données liées ont été supprimées par cascade)')
  })

  console.log('\n=== Nettoyage terminé ===')
}

async function main() {
  const args = process.argv.slice(2)
  const campaignId = args[0]
  const confirmedCampaignId = args[1]

  if (!campaignId) {
    console.error('Usage: npx tsx scripts/cleanup-test-data.ts <CAMPAIGN_ID> [CONFIRMED_CAMPAIGN_ID]')
    console.error('\nMode simulation (par défaut) :')
    console.error('  npx tsx scripts/cleanup-test-data.ts STOCKLY_TEST_RUN_20261111')
    console.error('\nMode réel (avec confirmation) :')
    console.error('  npx tsx scripts/cleanup-test-data.ts STOCKLY_TEST_RUN_20261111 STOCKLY_TEST_RUN_20261111')
    process.exit(1)
  }

  // Valider le format de l'identifiant de campagne
  if (!validateCampaignId(campaignId)) {
    console.error('\n❌ ERREUR : Identifiant de campagne invalide')
    console.error('L\'identifiant doit contenir au moins 10 caractères alphanumériques, tirets, underscores ou espaces.')
    process.exit(1)
  }

  console.log('==========================================')
  console.log('SCRIPT DE NETTOYAGE DE DONNÉES DE TEST')
  console.log('==========================================')

  const isDryRun = !confirmedCampaignId

  if (isDryRun) {
    console.log('\n⚠️ MODE SIMULATION ACTIVÉ')
    console.log('Aucune donnée ne sera supprimée.\n')
  } else {
    console.log('\n⚠️ MODE RÉEL ACTIVÉ')
    console.log('Les données seront supprimées définitivement.\n')
  }

  const summary = await getCleanupSummary(campaignId)

  if (summary.organizations.length === 0) {
    console.log('\nAucune donnée à supprimer.')
    process.exit(0)
  }

  if (isDryRun) {
    console.log('\n=== FIN DE LA SIMULATION ===')
    console.log('Pour exécuter réellement le nettoyage, exécutez :')
    console.log(`  npx tsx scripts/cleanup-test-data.ts ${campaignId} ${campaignId}`)
    process.exit(0)
  }

  // Mode réel : demande de confirmation supplémentaire
  console.log('\n=== CONFIRMATION FINALE ===')
  console.log('Vous êtes sur le point de supprimer définitivement :')
  console.log(`  - ${summary.organizations.length} organisation(s)`)
  console.log(`  - ${summary.users.length} utilisateur(s)`)
  console.log(`  - ${summary.stores.length} magasin(s)`)
  console.log(`  - ${summary.products} produit(s)`)
  console.log(`  - ${summary.customers} client(s)`)
  console.log(`  - ${summary.suppliers} fournisseur(s)`)
  console.log(`  - ${summary.categories} catégorie(s)`)
  console.log(`  - ${summary.brands} marque(s)`)
  console.log(`  - ${summary.stockMovements} mouvement(s) de stock`)
  console.log('\nTapez "YES" pour confirmer, ou appuyez sur Ctrl+C pour annuler : ')

  // Note: Pour une interaction réelle, utiliser readline ou un outil comme prompt-confirm
  // Pour simplifier, nous supposons que l'argument de confirmation suffit
  console.log('\nConfirmation reçue via l\'argument de ligne de commande.')
  console.log('Exécution du nettoyage...\n')

  await executeCleanup(summary, campaignId, confirmedCampaignId)
}

main()
  .then(() => {
    console.log('Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Erreur lors du nettoyage:', error)
    process.exit(1)
  })
  .finally(() => {
    pool.end()
  })
