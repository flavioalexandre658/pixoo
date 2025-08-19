import { db } from "@/db";
import { creditPackages } from "@/db/schema";
import { nanoid } from "nanoid";

const packages = [
  // ===== BRL =====
  {
    id: nanoid(),
    code: "standard_brl",
    name: "Pacote Padrão",
    description: "40 créditos para suas criações",
    credits: 40,
    priceInCents: 1999, // R$ 19,99
    currency: "BRL",
    isActive: true,
    isPopular: false,
  },
  {
    id: nanoid(),
    code: "plus_brl",
    name: "Pacote Plus",
    description: "120 créditos para acelerar seu fluxo",
    credits: 120,
    priceInCents: 4999, // R$ 49,99
    currency: "BRL",
    isActive: true,
    isPopular: true, // destaque visual sugerido
  },
  {
    id: nanoid(),
    code: "pro_brl",
    name: "Pacote Pro",
    description: "300 créditos para uso recorrente",
    credits: 300,
    priceInCents: 9999, // R$ 99,99
    currency: "BRL",
    isActive: true,
    isPopular: false,
  },
  {
    id: nanoid(),
    code: "advanced_brl",
    name: "Pacote Advanced",
    description: "700 créditos para alto volume",
    credits: 700,
    priceInCents: 19999, // R$ 199,99
    currency: "BRL",
    isActive: true,
    isPopular: false,
  },

  // ===== USD =====
  {
    id: nanoid(),
    code: "standard_usd",
    name: "Standard Package",
    description: "40 credits for your creations",
    credits: 40,
    priceInCents: 400, // $4.00
    currency: "USD",
    isActive: true,
    isPopular: false,
  },
  {
    id: nanoid(),
    code: "plus_usd",
    name: "Plus Package",
    description: "120 credits to speed up your workflow",
    credits: 120,
    priceInCents: 1000, // $10.00
    currency: "USD",
    isActive: true,
    isPopular: true,
  },
  {
    id: nanoid(),
    code: "pro_usd",
    name: "Pro Package",
    description: "300 credits for frequent use",
    credits: 300,
    priceInCents: 2000, // $20.00
    currency: "USD",
    isActive: true,
    isPopular: false,
  },
  {
    id: nanoid(),
    code: "advanced_usd",
    name: "Advanced Package",
    description: "700 credits for high-volume workflows",
    credits: 700,
    priceInCents: 4000, // $40.00
    currency: "USD",
    isActive: true,
    isPopular: false,
  },
];

async function initCreditPackages() {
  try {
    console.log("🚀 Inicializando pacotes de créditos...");
    for (const pkg of packages) {
      await db
        .insert(creditPackages)
        .values({
          ...pkg,
          isActive: pkg.isActive ? "1" : "0",
          isPopular: pkg.isPopular ? "1" : "0",
        })
        .onConflictDoNothing();
      console.log(`✅ Pacote criado: ${pkg.name} [${pkg.currency}]`);
    }
    console.log("✅ Pacotes de créditos inicializados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inicializar pacotes:", error);
  }
}

initCreditPackages();
