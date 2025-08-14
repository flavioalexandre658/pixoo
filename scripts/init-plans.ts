import { randomUUID } from 'crypto';
import { db } from '../src/db';
import { plans } from '../src/db/schema';

/**
 * Script para inicializar os planos no banco de dados
 * Execute este script após configurar o banco de dados
 */

const PLANS_DATA = [
  // Planos em USD
  {
    code: 'free',
    name: 'Free Plan',
    description: 'Start your creative journey with our free tier',
    priceInCents: 0,
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    credits: 5, // 5 daily credits
    features: JSON.stringify([
      '5 créditos diários por dia',
      'Imagens de alta qualidade',
      'Geração de imagem lenta',
      'Apenas Pixoo Init (1 Crédito/Imagem)',
      'Sem histórico de registros',
      'Sem licença comercial'
    ]),
    isActive: true,
    isPopular: false
  },
  {
    code: 'starter',
    name: 'Starter Plan',
    description: 'Ideal for creators getting started with AI image generation',
    priceInCents: 1490, // $14.90
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    credits: 400,
    features: JSON.stringify([
      '400 créditos por mês',
      'Uso ilimitado do Pixoo Init 🔥',
      'Receba todos os créditos de uma vez com taxa anual',
      'Histórico de 90 dias',
      'Licença comercial'
    ]),
    isActive: true,
    isPopular: false
  },
  {
    code: 'premium',
    name: 'Premium Plan',
    description: 'Enhanced features for professional content creators',
    priceInCents: 2290, // $22.90
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    credits: 800,
    features: JSON.stringify([
      '800 créditos por mês',
      'Uso ilimitado do Pixoo Init 🔥',
      'Receba todos os créditos de uma vez com taxa anual',
      'Histórico permanente',
      'Licença comercial'
    ]),
    isActive: true,
    isPopular: true
  },
  {
    code: 'advanced',
    name: 'Advanced Plan',
    description: 'Maximum power for high-volume creative workflows',
    priceInCents: 3290, // $32.90
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    credits: 1500,
    features: JSON.stringify([
      '1500 créditos por mês',
      'Uso ilimitado do Pixoo Init 🔥',
      'Receba todos os créditos de uma vez com taxa anual',
      'Histórico permanente',
      'Licença comercial'
    ]),
    isActive: true,
    isPopular: false
  },
  // Planos em BRL
  {
    code: 'free',
    name: 'Free Plan',
    description: 'Comece sua jornada criativa com nosso plano gratuito',
    priceInCents: 0,
    currency: 'BRL',
    interval: 'monthly',
    intervalCount: 1,
    credits: 5, // 5 daily credits
    features: JSON.stringify([
      '5 créditos diários por dia',
      'Imagens de alta qualidade',
      'Geração de imagem lenta',
      'Apenas Pixoo Init (1 Crédito/Imagem)',
      'Sem histórico de registros',
      'Sem licença comercial'
    ]),
    isActive: true,
    isPopular: false
  },
  {
    code: 'starter',
    name: 'Starter Plan',
    description: 'Ideal para criadores iniciantes na geração de imagens com IA',
    priceInCents: 8990, // R$ 81.95 (14.90 * 5.5)
    currency: 'BRL',
    interval: 'monthly',
    intervalCount: 1,
    credits: 400,
    features: JSON.stringify([
      '400 créditos por mês',
      'Uso ilimitado do Pixoo Init 🔥',
      'Receba todos os créditos de uma vez com taxa anual',
      'Histórico de 90 dias',
      'Licença comercial'
    ]),
    isActive: true,
    isPopular: false
  },
  {
    code: 'premium',
    name: 'Premium Plan',
    description: 'Recursos aprimorados para criadores de conteúdo profissionais',
    priceInCents: 14990, // R$ 125.95 (22.90 * 5.5)
    currency: 'BRL',
    interval: 'monthly',
    intervalCount: 1,
    credits: 800,
    features: JSON.stringify([
      '800 créditos por mês',
      'Uso ilimitado do Pixoo Init 🔥',
      'Receba todos os créditos de uma vez com taxa anual',
      'Histórico permanente',
      'Licença comercial'
    ]),
    isActive: true,
    isPopular: true
  },
  {
    code: 'advanced',
    name: 'Advanced Plan',
    description: 'Máximo poder para fluxos de trabalho criativos de alto volume',
    priceInCents: 19990, // R$ 180.95 (32.90 * 5.5)
    currency: 'BRL',
    interval: 'monthly',
    intervalCount: 1,
    credits: 1500,
    features: JSON.stringify([
      '1500 créditos por mês',
      'Uso ilimitado do Pixoo Init 🔥',
      'Receba todos os créditos de uma vez com taxa anual',
      'Histórico permanente',
      'Licença comercial'
    ]),
    isActive: true,
    isPopular: false
  }
];

async function initializePlans() {
  try {
    console.log("🚀 Inicializando planos...");

    // Inserir planos no banco de dados
    for (const planData of PLANS_DATA) {
      await db.insert(plans).values({
        id: randomUUID(),
        ...planData
      });
    }

    console.log("✅ Planos inicializados com sucesso!");
    console.log("📋 Planos configurados:");
    console.log("\n💵 Planos em USD:");
    console.log("  - Free Plan: $0 - 5 créditos diários");
    console.log("  - Starter Plan: $14.90/mês - 400 créditos");
    console.log("  - Premium Plan: $22.90/mês - 800 créditos (Popular)");
    console.log("  - Advanced Plan: $32.90/mês - 1500 créditos");
    console.log("\n🇧🇷 Planos em BRL:");
    console.log("  - Free Plan: R$0 - 5 créditos diários");
    console.log("  - Starter Plan: R$81.95/mês - 400 créditos");
    console.log("  - Premium Plan: R$125.95/mês - 800 créditos (Popular)");
    console.log("  - Advanced Plan: R$180.95/mês - 1500 créditos");

  } catch (error) {
    console.error("❌ Erro ao inicializar planos:", error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  initializePlans()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { initializePlans };