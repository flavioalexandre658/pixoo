# Exemplo de Uso do Sistema de Créditos

Este documento demonstra como o novo sistema de reserva e confirmação de créditos funciona na prática.

## Fluxo Completo de Geração de Imagem

### 1. Usuário Inicia Geração

Quando o usuário clica em "Gerar Imagem":

```typescript
// FormTextToImage.tsx - onSubmit
const onSubmit = async (data: FormTextToImageForm) => {
  try {
    // 1. Reservar créditos ANTES de chamar a API
    const reservation = await reserveCredits(selectedModel.id, "Reserva para geração de imagem");
    setCurrentReservation(reservation);
    
    // 2. Chamar API de geração
    const response = await fetch("/api/text-to-image", {
      method: "POST",
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.taskId) {
        // 3. Iniciar polling com dados da reserva
        onStartPolling?.(result.taskId, {
          reservationId: reservation.reservationId,
          modelId: selectedModel.id
        });
      }
    }
  } catch (error) {
    // 4. Reembolsar em caso de erro
    if (currentReservation) {
      await refundCredits(currentReservation.cost, "Erro na geração");
    }
  }
};
```

### 2. Polling Monitora Status

```typescript
// TextToImage.tsx - startPolling
const startPolling = (taskId: string, reservationData) => {
  setCurrentReservation(reservationData);
  
  const checkStatus = async () => {
    const response = await fetch(`/api/images/${taskId}`);
    const data = await response.json();
    
    if (data.status === "ready" && data.imageUrl) {
      // ✅ SUCESSO: Confirmar créditos
      if (currentReservation) {
        await confirmSpendCredits(
          currentReservation.reservationId,
          currentReservation.modelId,
          taskId
        );
      }
      // Mostrar imagem para o usuário
      handleImageGenerated(data.imageUrl);
      
    } else if (data.status === "error") {
      // ❌ FALHA: Reembolsar créditos
      if (currentReservation) {
        await refundCredits(cost, "Falha na geração", taskId);
      }
    }
  };
  
  // Polling a cada 6 segundos
  setInterval(checkStatus, 6000);
};
```

### 3. Webhook Confirma Automaticamente

```typescript
// webhook/bfl/route.ts
export async function POST(request: NextRequest) {
  const payload = await request.json();
  
  if (payload.status === "SUCCESS") {
    // Buscar reserva pendente
    const reservation = await findPendingReservation(payload.task_id);
    
    if (reservation) {
      // ✅ Confirmar créditos via webhook
      await CreditsService.confirmSpendCredits({
        userId: imageRecord.userId,
        modelId: imageRecord.model,
        imageId: payload.task_id,
        reservationId: reservation.reservationId
      });
    }
  } else if (payload.status === "FAILED") {
    // ❌ Reembolsar créditos via webhook
    await CreditsService.refundCredits({
      userId: imageRecord.userId,
      amount: imageRecord.creditsUsed,
      description: "Falha na geração via webhook"
    });
  }
}
```

## Cenários de Uso

### ✅ Cenário 1: Geração Bem-Sucedida

1. **Reserva**: 10 créditos reservados
2. **API**: Retorna taskId
3. **Polling**: Detecta status "ready"
4. **Confirmação**: 10 créditos descontados
5. **Resultado**: Usuário vê a imagem, créditos descontados

### ❌ Cenário 2: Falha na API

1. **Reserva**: 10 créditos reservados
2. **API**: Retorna erro 500
3. **Reembolso**: 10 créditos devolvidos
4. **Resultado**: Usuário mantém créditos, vê mensagem de erro

### ❌ Cenário 3: Falha na Geração

1. **Reserva**: 10 créditos reservados
2. **API**: Retorna taskId
3. **Polling**: Detecta status "error"
4. **Reembolso**: 10 créditos devolvidos
5. **Resultado**: Usuário mantém créditos, vê mensagem de erro

### ⏰ Cenário 4: Timeout

1. **Reserva**: 10 créditos reservados
2. **API**: Retorna taskId
3. **Polling**: Timeout após 5 minutos
4. **Reembolso**: 10 créditos devolvidos
5. **Resultado**: Usuário mantém créditos, vê mensagem de timeout

## Vantagens do Sistema

### 🔒 Segurança
- Créditos só são descontados após confirmação de sucesso
- Impossível perder créditos por falhas técnicas
- Sistema de reserva previne uso simultâneo

### 🔄 Recuperação Automática
- Reembolso automático em todos os cenários de falha
- Webhook como backup para confirmação
- Timeout com reembolso automático

### 📊 Transparência
- Todas as operações registradas no histórico
- Rastreamento completo de reservas e confirmações
- Auditoria de todas as transações

### 🚀 Performance
- Reserva instantânea (não bloqueia UI)
- Confirmação assíncrona
- Polling eficiente com intervalos otimizados

## Monitoramento

### Logs do Sistema

```
✅ Credits reserved: reservationId=abc123, modelId=flux-dev, cost=10
🔄 Polling started: taskId=task456, reservationId=abc123
✅ Task completed successfully via polling!
✅ Credits confirmed successfully!
```

### Logs de Erro

```
❌ Task failed via polling: Invalid prompt
✅ Credits refunded successfully!
```

### Logs de Webhook

```
✅ Credits confirmed via webhook for task: task456
✅ Credits refunded via webhook for failed task: task789
```

Este sistema garante que os créditos sejam sempre tratados de forma justa e transparente, protegendo tanto o usuário quanto a plataforma.