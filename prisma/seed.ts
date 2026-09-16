import "dotenv/config";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Debut du seed Stockly...");

  // Nettoyage dans le bon ordre
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();
  await prisma.organization.deleteMany();

  // Organisation
  const organization = await prisma.organization.create({
    data: {
      name: "Atlas Electromenager",
    },
  });

  // Magasin
  const store = await prisma.store.create({
    data: {
      name: "Atlas Electromenager - Casablanca",
      organizationId: organization.id,
    },
  });

  // Utilisateur de demonstration
  await prisma.user.create({
    data: {
      email: "admin@stockly.ma",
      name: "Anwar",
      role: "OWNER",
      organizationId: organization.id,
    },
  });

  // Categories
  const refrigerators = await prisma.category.create({
    data: {
      name: "Refrigerateurs",
      storeId: store.id,
    },
  });

  const washingMachines = await prisma.category.create({
    data: {
      name: "Lave-linge",
      storeId: store.id,
    },
  });

  const televisions = await prisma.category.create({
    data: {
      name: "Televiseurs",
      storeId: store.id,
    },
  });

  const airConditioners = await prisma.category.create({
    data: {
      name: "Climatiseurs",
      storeId: store.id,
    },
  });

  // Marques
  const samsung = await prisma.brand.create({
    data: {
      name: "Samsung",
      storeId: store.id,
    },
  });

  const lg = await prisma.brand.create({
    data: {
      name: "LG",
      storeId: store.id,
    },
  });

  const whirlpool = await prisma.brand.create({
    data: {
      name: "Whirlpool",
      storeId: store.id,
    },
  });

  const hisense = await prisma.brand.create({
    data: {
      name: "Hisense",
      storeId: store.id,
    },
  });

  // Produits
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Refrigerateur Samsung 350L",
        sku: "SAM-REF-350",
        description: "Refrigerateur Samsung No Frost 350 litres",
        purchasePrice: 5200,
        sellingPrice: 6499,
        stock: 0,
        minStock: 3,
        categoryId: refrigerators.id,
        brandId: samsung.id,
        storeId: store.id,
      },
    }),

    prisma.product.create({
      data: {
        name: "Refrigerateur LG 420L",
        sku: "LG-REF-420",
        description: "Refrigerateur LG No Frost 420 litres",
        purchasePrice: 6100,
        sellingPrice: 7499,
        stock: 5,
        minStock: 3,
        categoryId: refrigerators.id,
        brandId: lg.id,
        storeId: store.id,
      },
    }),

    prisma.product.create({
      data: {
        name: "Lave-linge Samsung 9Kg",
        sku: "SAM-LAV-9KG",
        description: "Lave-linge Samsung 9 Kg",
        purchasePrice: 3300,
        sellingPrice: 4299,
        stock: 12,
        minStock: 4,
        categoryId: washingMachines.id,
        brandId: samsung.id,
        storeId: store.id,
      },
    }),

    prisma.product.create({
      data: {
        name: "Lave-linge LG 10Kg",
        sku: "LG-LAV-10KG",
        description: "Lave-linge LG 10 Kg",
        purchasePrice: 3700,
        sellingPrice: 4799,
        stock: 3,
        minStock: 4,
        categoryId: washingMachines.id,
        brandId: lg.id,
        storeId: store.id,
      },
    }),

    prisma.product.create({
      data: {
        name: "Televiseur Samsung 55 pouces",
        sku: "SAM-TV-55",
        description: "Smart TV Samsung 55 pouces 4K",
        purchasePrice: 5800,
        sellingPrice: 6999,
        stock: 7,
        minStock: 2,
        categoryId: televisions.id,
        brandId: samsung.id,
        storeId: store.id,
      },
    }),

    prisma.product.create({
      data: {
        name: "Televiseur LG 50 pouces",
        sku: "LG-TV-50",
        description: "Smart TV LG 50 pouces 4K",
        purchasePrice: 4600,
        sellingPrice: 5799,
        stock: 4,
        minStock: 2,
        categoryId: televisions.id,
        brandId: lg.id,
        storeId: store.id,
      },
    }),

    prisma.product.create({
      data: {
        name: "Climatiseur Hisense 12000 BTU",
        sku: "HIS-CLIM-12",
        description: "Climatiseur Hisense 12000 BTU",
        purchasePrice: 2800,
        sellingPrice: 3499,
        stock: 6,
        minStock: 3,
        categoryId: airConditioners.id,
        brandId: hisense.id,
        storeId: store.id,
      },
    }),

    prisma.product.create({
      data: {
        name: "Climatiseur Whirlpool 18000 BTU",
        sku: "WHI-CLIM-18",
        description: "Climatiseur Whirlpool 18000 BTU",
        purchasePrice: 3900,
        sellingPrice: 4799,
        stock: 2,
        minStock: 3,
        categoryId: airConditioners.id,
        brandId: whirlpool.id,
        storeId: store.id,
      },
    }),
  ]);

  // Mouvements de stock initiaux
  for (const product of products) {
    await prisma.stockMovement.create({
      data: {
        type: "IN",
        quantity: product.stock,
        reason: "Stock initial",
        productId: product.id,
        storeId: store.id,
      },
    });
  }

  console.log("Seed termine avec succes !");
  console.log(`${products.length} produits crees`);
  console.log("Magasin : Atlas Electromenager - Casablanca");
  console.log("Admin : admin@stockly.ma");
}

main()
  .catch((error) => {
    console.error("Erreur pendant le seed :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });