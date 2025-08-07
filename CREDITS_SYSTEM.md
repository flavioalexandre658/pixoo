# Sistema de Créditos - Pixoo

## Visão Geral

O sistema de créditos foi implementado com um mecanismo de reserva e confirmação para garantir que os créditos sejam descontados apenas quando a imagem for gerada com sucesso.

## Fluxo Recomendado

### 1. Reservar Créditos (Antes da Geração)

```typescript
const { reserveCredits, confirmSpendCredits, refundCredits } = useCredits();

// Reservar créditos antes de iniciar a geração
const reservation = await reserveCredits(modelId);
if (!reservation) {
  // Erro ao reservar (créditos insuficientes ou outro erro)
  return;
}

const { reservationId, cost } = reservation;
```

### 2. Gerar Imagem

```typescript
try {
  // Chamar API de geração de imagem
  const imageResult = await generateImage({
    prompt,
    modelId,
    // outros parâmetros
  });
  
  // Se a geração foi bem-sucedida, confirmar o gasto
  await confirmSpendCredits(reservationId, modelId, imageResult.id);
  
} catch (error) {
  // Se a geração falhou, reembolsar os créditos
  await refundCredits(
    cost, 
    `Falha na geração de imagem - ${modelId}: ${error.message}`,
    undefined // imageId (não existe pois falhou)
  );
}
```

## APIs Disponíveis

### Hook useCredits()

#### Métodos Principais:

- **`reserveCredits(modelId: string)`**: Reserva créditos antes da geração
  - Retorna: `{ reservationId: string, cost: number } | null`
  - Verifica se há créditos suficientes
  - Não desconta os créditos ainda

- **`confirmSpendCredits(reservationId: string, modelId: string, imageId?: string)`**: Confirma o gasto após geração bem-sucedida
  - Retorna: `boolean`
  - Desconta os créditos efetivamente
  - Registra a transação

- **`refundCredits(amount: number, description: string, relatedImageId?: string)`**: Reembolsa créditos em caso de falha
  - Retorna: `boolean`
  - Adiciona os créditos de volta ao saldo
  - Registra transação de reembolso

#### Métodos Legados (mantidos para compatibilidade):

- **`spendCredits(modelId: string, imageId?: string)`**: Desconta créditos imediatamente
- **`earnCredits(amount: number, description: string)`**: Adiciona créditos

## Endpoints da API

### POST /api/credits/reserve
```json
{
  "modelId": "flux-dev",
  "description": "Reserva para geração de imagem"
}
```

### POST /api/credits/confirm
```json
{
  "reservationId": "uuid-da-reserva",
  "modelId": "flux-dev",
  "imageId": "id-da-imagem-gerada",
  "description": "Geração de imagem - flux-dev"
}
```

### POST /api/credits/refund
```json
{
  "amount": 10,
  "description": "Falha na geração de imagem",
  "relatedImageId": "id-da-imagem" // opcional
}
```

## Vantagens do Sistema

1. **Segurança**: Créditos só são descontados após confirmação de sucesso
2. **Transparência**: Todas as operações são registradas no histórico
3. **Recuperação**: Sistema automático de reembolso em caso de falha
4. **Compatibilidade**: Métodos legados mantidos para transição gradual
5. **Auditoria**: Rastreamento completo de reservas e confirmações

## Tipos de Transação

- **`spent`**: Créditos gastos (confirmados)
- **`earned`**: Créditos adicionados
- **`refund`**: Créditos reembolsados

## Exemplo Completo de Uso

```typescript
const ImageGenerator = () => {
  const { reserveCredits, confirmSpendCredits, refundCredits } = useCredits();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (prompt: string, modelId: string) => {
    setIsGenerating(true);
    let reservation = null;

    try {
      // 1. Reservar créditos
      reservation = await reserveCredits(modelId);
      if (!reservation) {
        throw new Error('Não foi possível reservar créditos');
      }

      // 2. Gerar imagem
      const result = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, modelId })
      });

      if (!result.ok) {
        throw new Error('Falha na geração da imagem');
      }

      const imageData = await result.json();

      // 3. Confirmar gasto
      await confirmSpendCredits(
        reservation.reservationId, 
        modelId, 
        imageData.id
      );

      // Sucesso!
      toast.success('Imagem gerada com sucesso!');
      
    } catch (error) {
      // 4. Reembolsar em caso de erro
      if (reservation) {
        await refundCredits(
          reservation.cost,
          `Falha na geração: ${error.message}`
        );
      }
      
      toast.error('Erro na geração da imagem');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    // Seu componente aqui
  );
};
```

Este sistema garante que os créditos sejam sempre tratados de forma segura e transparente, com recuperação automática em caso de falhas.