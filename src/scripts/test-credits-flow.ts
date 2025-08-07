import { CreditsService } from "../services/credits/credits.service";
import { ReservationCleanupService } from "../services/credits/cleanup-expired-reservations";
import { randomUUID } from "crypto";

/**
 * Script para testar o fluxo completo de créditos
 * Execute com: npx tsx src/scripts/test-credits-flow.ts
 */
async function testCreditsFlow() {
  console.log("🧪 Iniciando teste do fluxo de créditos...");
  
  // IDs de teste (substitua por IDs reais do seu banco)
  const testUserId = "test-user-" + randomUUID();
  const testModelId = "flux-dev"; // ou outro modelo que existe no seu banco
  const testImageId = "test-image-" + randomUUID();
  
  try {
    // 1. Criar usuário de teste com créditos
    console.log("\n1️⃣ Criando usuário de teste...");
    await CreditsService.createUserCredits(testUserId, 100);
    console.log(`✅ Usuário criado com 100 créditos: ${testUserId}`);
    
    // 2. Verificar créditos iniciais
    const initialCredits = await CreditsService.getUserCredits(testUserId);
    console.log(`💰 Créditos iniciais:`, initialCredits);
    
    // 3. Fazer reserva de créditos
    console.log("\n2️⃣ Fazendo reserva de créditos...");
    const reservation = await CreditsService.reserveCredits({
      userId: testUserId,
      modelId: testModelId,
      description: "Teste de reserva"
    });
    console.log(`🔒 Reserva criada:`, reservation);
    
    // 4. Verificar créditos após reserva
    const creditsAfterReservation = await CreditsService.getUserCredits(testUserId);
    console.log(`💰 Créditos após reserva:`, creditsAfterReservation);
    
    // 5. Confirmar gasto de créditos
    console.log("\n3️⃣ Confirmando gasto de créditos...");
    const confirmed = await CreditsService.confirmSpendCredits({
      userId: testUserId,
      modelId: testModelId,
      imageId: testImageId,
      description: "Teste de confirmação",
      reservationId: reservation.reservationId
    });
    console.log(`✅ Confirmação bem-sucedida:`, confirmed);
    
    // 6. Verificar créditos finais
    const finalCredits = await CreditsService.getUserCredits(testUserId);
    console.log(`💰 Créditos finais:`, finalCredits);
    
    // 7. Verificar resumo de créditos
    const summary = await CreditsService.getUserCreditsSummary(testUserId);
    console.log(`📊 Resumo de créditos:`, summary);
    
    console.log("\n✅ Teste do fluxo básico concluído com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro no teste do fluxo básico:", error);
  }
}

async function testExpiredReservations() {
  console.log("\n🧪 Testando limpeza de reservas expiradas...");
  
  try {
    // Executar limpeza
    const cleanupResult = await ReservationCleanupService.fullCleanup();
    console.log(`🧹 Resultado da limpeza:`, cleanupResult);
    
  } catch (error) {
    console.error("❌ Erro no teste de limpeza:", error);
  }
}

async function testReservationNotFound() {
  console.log("\n🧪 Testando cenário de reserva não encontrada...");
  
  const testUserId = "test-user-" + randomUUID();
  const fakeReservationId = "fake-reservation-" + randomUUID();
  
  try {
    // Criar usuário de teste
    await CreditsService.createUserCredits(testUserId, 100);
    
    // Tentar confirmar com reserva inexistente
    await CreditsService.confirmSpendCredits({
      userId: testUserId,
      modelId: "flux-dev",
      imageId: "test-image",
      description: "Teste com reserva inexistente",
      reservationId: fakeReservationId
    });
    
    console.log("❌ Erro: deveria ter falhado com reserva inexistente");
    
  } catch (error) {
    console.log(`✅ Erro esperado capturado:`, error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  console.log("🚀 Iniciando testes do sistema de créditos...");
  
  await testCreditsFlow();
  await testExpiredReservations();
  await testReservationNotFound();
  
  console.log("\n🎉 Todos os testes concluídos!");
  process.exit(0);
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Erro fatal nos testes:", error);
    process.exit(1);
  });
}

export { testCreditsFlow, testExpiredReservations, testReservationNotFound };