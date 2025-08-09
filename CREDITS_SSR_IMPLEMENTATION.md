# Implementação de SSR para Sistema de Créditos

Este documento descreve a implementação do carregamento de créditos no lado do servidor (SSR) e a sincronização com o estado do cliente.

## Arquitetura

### 1. Contexto de Créditos (`/src/contexts/credits-context.tsx`)

- **Propósito**: Gerenciar o estado global dos créditos do usuário
- **Funcionalidades**:
  - Recebe créditos iniciais do SSR
  - Sincroniza atualizações entre componentes
  - Atualiza automaticamente quando a aba volta ao foco
  - Gerencia estados de loading e erro

### 2. Função SSR (`/src/lib/credits-ssr.ts`)

- **Propósito**: Buscar créditos no servidor durante o SSR
- **Funcionalidades**:
  - Autentica o usuário no servidor
  - Busca dados de créditos diretamente do banco
  - Retorna dados estruturados para hidratação

### 3. Layout da Aplicação Atualizado

- **Server Component**: Busca créditos no SSR
- **Client Wrapper**: Mantém funcionalidades client-side
- **Provider**: Injeta créditos iniciais no contexto

## Fluxo de Dados

```
1. Server Component (layout.tsx)
   ↓ Busca créditos no SSR
2. CreditsProvider
   ↓ Injeta créditos iniciais
3. Client Components
   ↓ Consomem via useCreditsContext
4. Hook useCredits
   ↓ Operações de créditos
5. Sincronização automática
```

## Benefícios

### Performance
- **Hidratação instantânea**: Créditos são renderizados imediatamente
- **Menos requests**: Evita busca inicial no cliente
- **SEO friendly**: Dados disponíveis no primeiro render

### UX
- **Sem loading inicial**: Saldo aparece imediatamente
- **Sincronização automática**: Atualizações em tempo real
- **Estado consistente**: Compartilhado entre componentes

## Uso

### Em Componentes

```tsx
import { useCreditsContext } from '@/contexts/credits-context';

function MyComponent() {
  const { credits, isLoading, fetchCredits } = useCreditsContext();
  
  return (
    <div>
      <p>Saldo: {credits?.balance || 0}</p>
      <button onClick={fetchCredits}>Atualizar</button>
    </div>
  );
}
```

### Para Operações de Créditos

```tsx
import { useCredits } from '@/hooks/use-credits';

function PaymentComponent() {
  const { reserveCredits, confirmSpendCredits, cancelReservation } = useCredits();
  
  // Usar as funções normalmente
  // O contexto será atualizado automaticamente
}
```

## Migração

### Componentes Existentes
- **CreditsDisplay**: Atualizado para usar contexto
- **useCredits**: Refatorado para usar contexto internamente
- **API pública**: Mantida inalterada para compatibilidade

### Novos Componentes
- Usar `useCreditsContext()` diretamente para acesso aos dados
- Usar `useCredits()` para operações (reservar, confirmar, etc.)

## Considerações Técnicas

### Segurança
- Autenticação verificada no servidor
- Dados sensíveis não expostos no cliente
- Validação dupla (servidor + cliente)

### Escalabilidade
- Cache de dados no contexto
- Atualizações otimizadas
- Sincronização eficiente

### Manutenibilidade
- Separação clara de responsabilidades
- Código reutilizável
- Testes facilitados