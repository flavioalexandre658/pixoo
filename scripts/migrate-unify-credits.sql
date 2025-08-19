-- Migração para unificar créditos: transferir freeCreditsBalance para balance
-- e remover a coluna freeCreditsBalance

BEGIN;

-- 1. Transferir freeCreditsBalance para balance
UPDATE user_credits 
SET 
  balance = balance + freeCreditsBalance,
  total_earned = total_earned + freeCreditsBalance,
  updated_at = NOW()
WHERE freeCreditsBalance > 0;

-- 2. Criar uma transação para registrar a unificação
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
  uc.freeCreditsBalance,
  'Unificação de créditos: transferência de créditos gratuitos para saldo principal',
  uc.balance,
  NOW()
FROM user_credits uc
WHERE uc.freeCreditsBalance > 0;

-- 3. Remover a coluna freeCreditsBalance
ALTER TABLE user_credits DROP COLUMN freeCreditsBalance;

-- 4. Remover a coluna lastFreeCreditsRenewal (não será mais necessária)
ALTER TABLE user_credits DROP COLUMN lastFreeCreditsRenewal;

COMMIT;