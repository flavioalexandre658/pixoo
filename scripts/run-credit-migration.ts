import { db } from "@/db";
import { sql } from "drizzle-orm";

async function migrateCreditUnification() {
  console.log("Iniciando migração de unificação de créditos...");
  
  try {
    console.log("1. Transferindo freeCreditsBalance para balance...");
    
    // 1. Transferir freeCreditsBalance para balance
    const updateResult = await db.execute(sql`
      UPDATE user_credits 
      SET 
        balance = balance + free_credits_balance,
        total_earned = total_earned + free_credits_balance,
        updated_at = NOW()
      WHERE free_credits_balance > 0
    `);
    
    console.log(`✅ Atualizados ${updateResult.rowCount} registros de usuários`);

    console.log("2. Criando transações de histórico...");
    
    // 2. Criar transações para registrar a unificação
    const transactionResult = await db.execute(sql`
      INSERT INTO credit_transactions (
        id,
        user_id,
        type,
        amount,
        description,
        balance_after,
        created_at
      )
      SELECT 
        'unify_' || uc.user_id || '_' || extract(epoch from now())::text,
        uc.user_id,
        'earned',
        uc.free_credits_balance,
        'Unificação de créditos: transferência de créditos gratuitos para saldo principal',
        uc.balance,
        NOW()
      FROM user_credits uc
      WHERE uc.free_credits_balance > 0
    `);
    
    console.log(`✅ Criadas ${transactionResult.rowCount} transações de histórico`);

    console.log("3. Removendo coluna free_credits_balance...");
    
    // 3. Remover a coluna free_credits_balance
    await db.execute(sql`ALTER TABLE user_credits DROP COLUMN IF EXISTS free_credits_balance`);
    
    console.log("✅ Coluna free_credits_balance removida");

    console.log("4. Removendo coluna last_free_credits_renewal...");
    
    // 4. Remover a coluna last_free_credits_renewal
    await db.execute(sql`ALTER TABLE user_credits DROP COLUMN IF EXISTS last_free_credits_renewal`);
    
    console.log("✅ Coluna last_free_credits_renewal removida");
    
    console.log("🎉 Migração concluída com sucesso!");
    console.log("\n📋 Resumo:");
    console.log(`- Usuários atualizados: ${updateResult.rowCount}`);
    console.log(`- Transações criadas: ${transactionResult.rowCount}`);
    console.log("- Colunas removidas: free_credits_balance, last_free_credits_renewal");
    
  } catch (error) {
    console.error("❌ Erro na migração:", error);
    throw error;
  }
}

migrateCreditUnification()
  .then(() => {
    console.log("\n✅ Script finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script finalizado com erro:", error);
    process.exit(1);
  });