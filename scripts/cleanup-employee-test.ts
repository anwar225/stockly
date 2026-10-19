import "dotenv/config";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Configuration
const TEST_EMAIL = "employee-test@stockly.ma";
const OWNER_EMAIL = "admin@stockly.ma";
const TEST_STORE_NAME = "Atlas Electromenager - Casablanca";

async function main() {
  console.log("=== Nettoyage du compte EMPLOYEE de test ===\n");

  // Vérifier que le compte de test existe
  console.log(`Recherche du compte: ${TEST_EMAIL}...`);
  const testUser = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
  });

  if (!testUser) {
    console.log(`ℹ️  Aucun compte trouvé avec l'email ${TEST_EMAIL}.`);
    console.log("   Rien à nettoyer.\n");
    process.exit(0);
  }

  console.log(`✅ Compte trouvé: ${testUser.email} (ID: ${testUser.id})\n`);

  // Protection 1 : vérifier que ce n'est pas le compte OWNER
  if (testUser.email === OWNER_EMAIL) {
    console.error("❌ ERREUR CRITIQUE: Tentative de suppression du compte OWNER !");
    console.error("   Le script s'arrête immédiatement pour protéger le compte admin.");
    process.exit(1);
  }

  // Protection 2 : vérifier que le compte a un StoreMember
  console.log("Vérification des StoreMember pour ce compte...");
  const storeMembers = await prisma.storeMember.findMany({
    where: { userId: testUser.id },
    include: { store: true },
  });

  if (storeMembers.length === 0) {
    console.error("❌ ERREUR: Le compte n'a aucun StoreMember.");
    console.error("   État incohérent, le script s'arrête.");
    process.exit(1);
  }

  if (storeMembers.length > 1) {
    console.error(`❌ ERREUR: Le compte a ${storeMembers.length} StoreMember.`);
    console.error("   Attendu: exactement 1 StoreMember pour le compte de test.");
    console.error("   Le script s'arrête pour éviter toute ambiguïté.");
    process.exit(1);
  }

  const storeMember = storeMembers[0];
  console.log(`✅ StoreMember unique trouvé (ID: ${storeMember.id})\n`);

  // Protection 3 : vérifier que le StoreMember a le rôle EMPLOYEE
  if (storeMember.role !== "EMPLOYEE") {
    console.error(`❌ ERREUR: Le StoreMember a le rôle ${storeMember.role}.`);
    console.error("   Attendu: EMPLOYEE");
    console.error("   Le script refuse de supprimer un compte avec un rôle différent.");
    process.exit(1);
  }

  console.log(`✅ Rôle StoreMember: EMPLOYEE\n`);

  // Protection 4 : vérifier que le magasin est celui attendu
  if (storeMember.store.name !== TEST_STORE_NAME) {
    console.error(`❌ ERREUR: Le StoreMember appartient au magasin "${storeMember.store.name}".`);
    console.error(`   Attendu: "${TEST_STORE_NAME}"`);
    console.error("   Le script refuse de supprimer un compte d'un autre magasin.");
    process.exit(1);
  }

  console.log(`✅ Magasin: ${storeMember.store.name} (ID: ${storeMember.store.id})\n`);

  // Protection 5 : vérifier que le compte n'est pas OWNER (double protection)
  if (testUser.role === "OWNER") {
    console.error("❌ ERREUR: Le compte a le rôle global OWNER.");
    console.error("   Le script refuse de supprimer un compte OWNER.");
    process.exit(1);
  }

  console.log("✅ Vérifications de sécurité réussies.\n");

  // Confirmer la suppression
  console.log("ATTENTION: Ce script va supprimer:");
  console.log(`  - Le StoreMember pour ${TEST_EMAIL}`);
  console.log(`  - Le User ${TEST_EMAIL}\n`);

  // Suppression dans une transaction atomique
  console.log("Suppression dans une transaction atomique...");

  try {
    await prisma.$transaction(async (tx) => {
      // Supprimer le StoreMember d'abord
      await tx.storeMember.deleteMany({
        where: { userId: testUser.id },
      });

      console.log("   - StoreMember supprimé");

      // Supprimer le User ensuite
      await tx.user.delete({
        where: { id: testUser.id },
      });

      console.log("   - User supprimé");
    });

    console.log("\n✅ Transaction réussie !\n");

    console.log("===========================================");
    console.log("Nettoyage terminé avec succès !");
    console.log("Le compte EMPLOYEE de test a été supprimé.");
    console.log("===========================================\n");

    // Vérifier que le compte OWNER existe toujours
    console.log(`Vérification du compte OWNER: ${OWNER_EMAIL}...`);
    const ownerUser = await prisma.user.findUnique({
      where: { email: OWNER_EMAIL },
    });

    if (ownerUser) {
      console.log(`✅ Compte OWNER préservé: ${ownerUser.email}\n`);
    } else {
      console.error("⚠️  AVERTISSEMENT: Le compte OWNER n'a pas été trouvé !\n");
    }

  } catch (error) {
    console.error("\n❌ ERREUR lors de la transaction. Toutes les suppressions ont été annulées.");
    console.error(error);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("\n❌ ERREUR lors du nettoyage:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
