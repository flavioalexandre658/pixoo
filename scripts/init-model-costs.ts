import { CreditsService } from '../src/services/credits/credits.service';

/**
 * Script para inicializar os custos dos modelos no banco de dados
 * Execute este script após configurar o banco de dados
 */
async function initializeModelCosts() {
  try {
    console.log("🚀 Inicializando custos dos modelos...");
    
    await CreditsService.initializeModelCosts();
    
    console.log("✅ Custos dos modelos inicializados com sucesso!");
    console.log("📋 Modelos configurados:");
    console.log("  - Flux Schnell: 0 créditos (gratuito)");
    console.log("  - Flux Dev: 2 créditos");
    console.log("  - Flux Pro: 5 créditos");
    console.log("  - Flux Pro 1.1: 4 créditos");
    console.log("  - Flux Pro 1.1 Ultra: 6 créditos");
    console.log("  - Flux Realism: 3 créditos");
    console.log("  - Flux Kontext Pro: 4 créditos");
    
  } catch (error) {
    console.error("❌ Erro ao inicializar custos dos modelos:", error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  initializeModelCosts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { initializeModelCosts };