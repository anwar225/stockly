import "dotenv/config";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Configuration
const TEST_EMAIL = "employee-test@stockly.ma";
const TEST_NAME = "Employee Test RBAC";
const TEST_STORE_NAME = "Atlas Electromenager - Casablanca";
const OWNER_EMAIL = "admin@stockly.ma";

async function main() {
  // Récupérer le mot de passe depuis l'argument de ligne de commande ou l'environnement
  const password = process.argv[2] || process.env.TEST_PASSWORD;

  if (!password) {
    console.error("❌ ERREUR: Mot de passe non fourni.");
    console.error("   Usage: npx tsx scripts/create-employee-test.ts <mot-de-passe>");
    console.error("   Ou définissez la variable d'environnement TEST_PASSWORD");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ ERREUR: Le mot de passe doit contenir au moins 8 caractères.");
    process.exit(1);
  }

  console.log("=== Création du compte EMPLOYEE de test ===\n");

  // Vérifier que le compte n'existe pas déjà
  console.log("Vérification que le compte n'existe pas déjà...");
  const existingUser = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
  });

  if (existingUser) {
    console.error(`❌ ERREUR: Un compte avec l'email ${TEST_EMAIL} existe déjà.`);
    console.error("   Le script s'arrête sans modifier de données.");
    process.exit(1);
  }

  console.log("✅ Aucun compte existant avec cet email.\n");

  // Récupérer le magasin spécifique et vérifier qu'il est unique
  console.log(`Récupération du magasin: ${TEST_STORE_NAME}...`);
  const stores = await prisma.store.findMany({
    where: { name: TEST_STORE_NAME },
  });

  if (stores.length === 0) {
    console.error(`❌ ERREUR: Aucun magasin nommé "${TEST_STORE_NAME}" trouvé.`);
    process.exit(1);
  }

  if (stores.length > 1) {
    console.error(`❌ ERREUR: ${stores.length} magasins nommés "${TEST_STORE_NAME}" trouvés.`);
    console.error("   Le script ne peut pas déterminer le bon magasin de manière univoque.");
    process.exit(1);
  }

  const store = stores[0];
  console.log(`✅ Magasin unique trouvé: ${store.name} (ID: ${store.id})\n`);

  // Récupérer l'organisation via le magasin (pas findFirst arbitraire)
  console.log("Récupération de l'organisation via le magasin...");
  const organization = await prisma.organization.findUnique({
    where: { id: store.organizationId },
  });

  if (!organization) {
    console.error("❌ ERREUR: Le magasin n'appartient à aucune organisation valide.");
    process.exit(1);
  }

  console.log(`✅ Organisation trouvée: ${organization.name} (ID: ${organization.id})\n`);

  // Vérifier que le compte OWNER existe
  console.log(`Vérification du compte OWNER: ${OWNER_EMAIL}...`);
  const ownerUser = await prisma.user.findUnique({
    where: { email: OWNER_EMAIL },
  });

  if (!ownerUser) {
    console.error(`❌ ERREUR: Le compte OWNER ${OWNER_EMAIL} n'existe pas.`);
    process.exit(1);
  }

  console.log(`✅ Compte OWNER trouvé: ${ownerUser.email} (ID: ${ownerUser.id})\n`);

  // Vérifier que le compte OWNER a un StoreMember OWNER sur ce magasin
  console.log("Vérification du StoreMember OWNER sur le magasin...");
  const ownerStoreMember = await prisma.storeMember.findUnique({
    where: {
      userId_storeId: {
        userId: ownerUser.id,
        storeId: store.id,
      },
    },
  });

  if (!ownerStoreMember) {
    console.error("❌ ERREUR: Le compte OWNER n'a pas de StoreMember sur ce magasin.");
    process.exit(1);
  }

  if (ownerStoreMember.role !== "OWNER") {
    console.error(`❌ ERREUR: Le StoreMember du compte OWNER a le rôle ${ownerStoreMember.role} au lieu de OWNER.`);
    process.exit(1);
  }

  console.log(`✅ StoreMember OWNER confirmé (ID: ${ownerStoreMember.id})\n`);
  console.log("✅ Compte OWNER ne sera PAS modifié.\n");

  console.log("✅ Mot de passe reçu (longueur: " + password.length + " caractères)\n");

  // Hacher le mot de passe
  console.log("Hachage du mot de passe...");
  const passwordHash = await bcrypt.hash(password, 10);
  console.log("✅ Mot de passe haché avec bcrypt (10 rounds)\n");

  // Créer User et StoreMember dans une transaction atomique
  console.log("Création du User et du StoreMember dans une transaction atomique...");

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const user = await tx.user.create({
        data: {
          email: TEST_EMAIL,
          name: TEST_NAME,
          role: "EMPLOYEE",
          active: true,
          organizationId: organization.id,
          passwordHash,
        },
      });

      console.log(`   - User créé: ${user.email} (ID: ${user.id})`);

      // Créer le StoreMember
      const storeMember = await tx.storeMember.create({
        data: {
          userId: user.id,
          storeId: store.id,
          role: "EMPLOYEE",
        },
      });

      console.log(`   - StoreMember créé (ID: ${storeMember.id})`);
      console.log(`   - Rôle StoreMember: EMPLOYEE`);
      console.log(`   - Magasin: ${store.name}`);

      return { user, storeMember };
    });

    console.log("\n✅ Transaction réussie !");
    console.log("===========================================");
    console.log("Compte EMPLOYEE de test créé avec succès:");
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Nom: ${TEST_NAME}`);
    console.log(`Magasin: ${store.name}`);
    console.log(`Rôle StoreMember: EMPLOYEE`);
    console.log(`Rôle User: EMPLOYEE`);
    console.log(`Actif: true`);
    console.log("===========================================\n");

    console.log("Instructions de nettoyage (après les tests):");
    console.log(`1. Supprimer le StoreMember avec userId: ${result.user.id}`);
    console.log(`2. Supprimer le User avec id: ${result.user.id}`);
    console.log(`3. Ou exécuter: npx tsx scripts/cleanup-employee-test.ts\n`);

  } catch (error) {
    console.error("\n❌ ERREUR lors de la transaction. Toutes les créations ont été annulées.");
    console.error(error);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("\n❌ ERREUR critique:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
