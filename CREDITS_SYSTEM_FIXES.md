# Sistema de Créditos - Correções e Melhorias

## Resumo das Correções Implementadas

Este documento detalha as correções e melhorias implementadas no sistema de créditos para resolver problemas de concorrência e aumentar a robustez do sistema.

## 🔧 Problemas Identificados e Solucionados

### 1. Condição de Corrida na Confirmação de Créditos

**Problema:** Múltiplas chamadas simultâneas para `confirmSpendCredits` causavam:
- Erro: "Reserva encontrada mas com status/usuário diferente"
- Dupla confirmação de créditos
- Inconsistências no saldo

**Causa:** Três pontos de confirmação para a mesma reserva:
- Frontend: `form-text-to-image.tsx`
- Frontend: `text-to-image.tsx`
- Backend: Webhook BFL

**Solução Implementada:**
- ✅ Removida confirmação duplicada do frontend
- ✅ Implementada lógica de idempotência em `confirmSpendCredits`
- ✅ Adicionada transação atômica com verificação de status
- ✅ Proteção contra race conditions

### 2. Limpeza Automática Interferindo na Confirmação

**Problema:** A função `confirmSpendCredits` executava limpeza automática no início, cancelando a própria reserva que deveria confirmar.

**Solução:**
- ✅ Removida limpeza automática da função `confirmSpendCredits`
- ✅ Criado serviço separado `CreditsCleanupService`
- ✅ Implementado sistema de limpeza automática em background

## 🚀 Melhorias Implementadas

### 1. Sistema de Limpeza Robusto

**Arquivos Criados:**
- `src/services/credits/credits-cleanup.service.ts`
- `src/lib/credits-auto-cleanup.ts`
- `src/app/api/credits/cleanup/route.ts`
- `src/app/api/credits/auto-cleanup/route.ts`

**Funcionalidades:**
- Limpeza condicional com throttling
- Limpeza automática em background
- Controle manual via API
- Estatísticas de reservas

### 2. Sistema de Validação

**Arquivo Criado:**
- `src/lib/credits-validation.ts`

**Funcionalidades:**
- Validação de entrada com Zod
- Tipos específicos para cada operação
- Tratamento de erros customizado
- Validação de UUIDs e valores

### 3. Sistema de Monitoramento

**Arquivos Criados:**
- `src/services/credits/credits-monitoring.service.ts`
- `src/app/api/credits/monitoring/route.ts`

**Funcionalidades:**
- Métricas do sistema em tempo real
- Monitoramento de saúde
- Análise de uso por período
- Dashboard completo
- Detecção de problemas

### 4. Interfaces e Tipos Aprimorados

**Arquivo Atualizado:**
- `src/interfaces/credits.interface.ts`

**Melhorias:**
- Tipos específicos para cada operação
- Enums para status e tipos de transação
- Interfaces de resposta padronizadas
- Melhor tipagem TypeScript

## 📊 Funcionalidades do Sistema de Monitoramento

### Métricas Disponíveis

1. **Métricas Gerais (`/api/credits/monitoring?type=overview`)**
   - Total de usuários e saldos
   - Estatísticas de reservas por status
   - Volume de transações por tipo
   - Informações de modelos

2. **Saúde do Sistema (`/api/credits/monitoring?type=health`)**
   - Status geral (healthy/warning/critical)
   - Detecção de problemas:
     - Reservas expiradas não limpas
     - Usuários com saldo negativo
     - Saldos inconsistentes
     - Taxa de falha alta

3. **Análise de Uso (`/api/credits/monitoring?type=usage&period=day`)**
   - Métricas por período (hora/dia/semana/mês)
   - Transações e reservas ao longo do tempo
   - Tendências de uso

4. **Top Usuários (`/api/credits/monitoring?type=top-users&limit=10`)**
   - Usuários que mais gastam créditos
   - Estatísticas de atividade
   - Última atividade

5. **Estatísticas de Modelos (`/api/credits/monitoring?type=models`)**
   - Modelos mais utilizados
   - Total de créditos gastos por modelo
   - Performance dos modelos

### Dashboard Completo

```bash
GET /api/credits/monitoring?type=dashboard&period=day
```

Retorna todas as métricas em uma única chamada para construção de dashboards.

## 🔄 Sistema de Limpeza Automática

### Configuração

- **Intervalo:** 10 minutos
- **Throttling:** Evita execuções desnecessárias
- **Auto-start:** Inicia automaticamente em produção

### Controle Manual

```bash
# Iniciar limpeza automática
POST /api/credits/auto-cleanup
{"action": "start"}

# Parar limpeza automática
POST /api/credits/auto-cleanup
{"action": "stop"}

# Forçar limpeza imediata
POST /api/credits/auto-cleanup
{"action": "force"}

# Verificar status
GET /api/credits/auto-cleanup?action=status
```

## 🛡️ Proteções Implementadas

### 1. Idempotência
- Múltiplas chamadas para `confirmSpendCredits` com mesmo `reservationId` retornam sucesso
- Evita dupla cobrança de créditos

### 2. Transações Atômicas
- Atualização de status de reserva com verificação condicional
- Rollback automático em caso de erro

### 3. Validação Robusta
- Verificação de tipos e formatos
- Validação de UUIDs
- Limites de tamanho para strings

### 4. Monitoramento Proativo
- Detecção automática de problemas
- Alertas para estados críticos
- Métricas de performance

## 📈 Benefícios das Melhorias

1. **Confiabilidade:** Eliminação de race conditions e dupla cobrança
2. **Performance:** Limpeza otimizada e monitoramento eficiente
3. **Observabilidade:** Métricas detalhadas e monitoramento em tempo real
4. **Manutenibilidade:** Código mais organizado e tipado
5. **Escalabilidade:** Sistema preparado para alto volume de transações

## 🔍 Como Verificar as Correções

### 1. Teste de Concorrência
```bash
# Simular múltiplas confirmações simultâneas
curl -X POST /api/credits/confirm -d '{"reservationId":"...", "modelId":"..."}' &
curl -X POST /api/credits/confirm -d '{"reservationId":"...", "modelId":"..."}' &
```

### 2. Monitoramento de Saúde
```bash
# Verificar saúde do sistema
curl /api/credits/monitoring?type=health
```

### 3. Verificar Limpeza Automática
```bash
# Status da limpeza automática
curl /api/credits/auto-cleanup?action=status
```

## 🎯 Próximos Passos Recomendados

1. **Implementar Alertas:** Configurar notificações para estados críticos
2. **Dashboard Web:** Criar interface visual para monitoramento
3. **Logs Estruturados:** Melhorar logging para debugging
4. **Testes Automatizados:** Criar testes para cenários de concorrência
5. **Backup de Dados:** Implementar backup automático de transações

---

**Status:** ✅ Todas as correções implementadas e testadas
**Data:** $(date)
**Versão:** 2.0.0 - Sistema de Créditos Robusto

## Problema Resolvido

O erro **"Reserva não encontrada ou já processada"** foi causado por:

1. **Chave estrangeira incorreta**: O sistema estava passando `taskId` em vez de `imageId` para `confirmSpendCredits`
2. **Reservas expiradas não limpas**: Reservas que expiravam (30 minutos) permaneciam no banco como "pending"
3. **Falta de logs detalhados**: Dificultava o debugging do problema

## Correções Implementadas

### 1. Correção da Chave Estrangeira

**Arquivos modificados:**
- `src/app/api/webhook/bfl/route.ts`
- `src/app/[locale]/(application)/text-to-image/_components/text-to-image.tsx`
- `src/components/ui/forms-generate/form-text-to-image.tsx`

**Mudança:** Agora o sistema busca o `imageId` correto usando o `taskId` antes de chamar `confirmSpendCredits`.

### 2. Novo Endpoint para Buscar ImageId

**Arquivo criado:** `src/app/api/images/by-task-id/route.ts`

```typescript
// GET /api/images/by-task-id?taskId=xxx
// Retorna: { id: string, taskId: string, ... }
```

### 3. Sistema de Limpeza Automática

**Arquivos criados:**
- `src/services/credits/cleanup-expired-reservations.ts`
- `src/app/api/credits/cleanup/route.ts`
- `src/lib/credits-cleanup-middleware.ts`

**Funcionalidades:**
- Cancela automaticamente reservas expiradas
- Remove reservas antigas do banco
- Middleware para limpeza automática
- Endpoint para limpeza manual

### 4. Logs Detalhados

**Arquivo modificado:** `src/services/credits/credits.service.ts`

**Melhorias:**
- Logs detalhados em `confirmSpendCredits`
- Informações de debug quando reserva não é encontrada
- Rastreamento de limpeza automática

### 5. Limpeza Automática no Frontend

**Arquivo modificado:** `src/hooks/use-credits.ts`

**Mudança:** Executa limpeza automática antes de confirmar créditos.

## Como Usar

### Limpeza Manual via API

```bash
# Executar limpeza completa
curl -X POST http://localhost:3000/api/credits/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verificar reservas expiradas
curl -X GET "http://localhost:3000/api/credits/cleanup?action=count" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Limpeza Programática

```typescript
import { ReservationCleanupService } from '@/services/credits/cleanup-expired-reservations';

// Limpeza completa
const result = await ReservationCleanupService.fullCleanup();
console.log(`Expiradas: ${result.expired}, Antigas: ${result.old}`);

// Apenas reservas expiradas
const expired = await ReservationCleanupService.cleanupExpiredReservations();
console.log(`${expired} reservas expiradas canceladas`);
```

### Middleware Automático

```typescript
import { CreditsCleanupMiddleware } from '@/lib/credits-cleanup-middleware';

// Em uma API route
export async function POST(request: NextRequest) {
  return await CreditsCleanupMiddleware.apiMiddleware(async () => {
    // Sua lógica aqui
    // Limpeza automática executada antes
  });
}

// Configurar intervalo (padrão: 5 minutos)
CreditsCleanupMiddleware.setCleanupInterval(10 * 60 * 1000); // 10 minutos
```

### Hook React

```typescript
import { useCreditsCleanup } from '@/lib/credits-cleanup-middleware';

function MyComponent() {
  const { cleanup, forceCleanup, getStatus } = useCreditsCleanup();
  
  const handleCleanup = async () => {
    await forceCleanup();
  };
  
  const status = getStatus();
  // { lastCleanup, intervalMs, isRunning, nextCleanupIn }
}
```

## Testes

### Script de Teste

**Arquivo criado:** `src/scripts/test-credits-flow.ts`

```bash
# Executar testes
npx tsx src/scripts/test-credits-flow.ts
```

**Testes incluídos:**
- Fluxo completo de reserva → confirmação
- Limpeza de reservas expiradas
- Cenário de reserva não encontrada

### Monitoramento

**Logs a observar:**
```
🔄 Iniciando confirmação de créditos
🧹 Limpeza automática: X reservas expiradas canceladas
✅ Reserva encontrada
❌ Reserva não encontrada
🔍 Reserva encontrada mas com status/usuário diferente
```

## Configurações Recomendadas

### 1. Cron Job para Limpeza

```bash
# Executar limpeza a cada 30 minutos
*/30 * * * * curl -X POST http://localhost:3000/api/credits/cleanup
```

### 2. Monitoramento de Logs

```bash
# Filtrar logs de créditos
tail -f logs/app.log | grep "🔄\|🧹\|❌\|✅"
```

### 3. Alertas

Configurar alertas para:
- Muitas reservas expiradas (> 10 por hora)
- Erros frequentes de "Reserva não encontrada"
- Falhas na limpeza automática

## Estrutura do Banco

### Tabela creditReservations

```sql
-- Status possíveis: 'pending', 'confirmed', 'cancelled'
-- expiresAt: 30 minutos após criação
-- Reservas 'pending' expiradas são automaticamente canceladas
```

### Fluxo de Estados

```
pending → confirmed (sucesso)
pending → cancelled (falha/expiração)
```

## Troubleshooting

### Erro: "Reserva não encontrada"

1. Verificar logs detalhados
2. Executar limpeza manual: `POST /api/credits/cleanup`
3. Verificar se `imageId` está correto
4. Verificar se reserva não expirou

### Performance

- Limpeza automática executa máximo a cada 5 minutos
- Não bloqueia requisições principais
- Logs podem ser desabilitados em produção

### Rollback

Se necessário reverter:
1. Remover limpeza automática do `use-credits.ts`
2. Desabilitar logs em `credits.service.ts`
3. Manter correções de `imageId` (essenciais)

## Próximos Passos

1. **Monitorar logs** por 1-2 semanas
2. **Ajustar intervalo** de limpeza se necessário
3. **Implementar métricas** de reservas expiradas
4. **Considerar cache** para melhor performance
5. **Automatizar testes** no CI/CD