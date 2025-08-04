# Database Setup

Este projeto utiliza Drizzle ORM com NeonDB (PostgreSQL).

## Configuração

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   - Copie `.env.example` para `.env.local`
   - Configure a `DATABASE_URL` com suas credenciais do NeonDB

3. **Gerar migrations:**
   ```bash
   npm run db:generate
   ```

4. **Aplicar migrations:**
   ```bash
   npm run db:push
   ```

## Scripts Disponíveis

- `npm run db:generate` - Gera migrations baseadas nos schemas
- `npm run db:migrate` - Aplica migrations pendentes
- `npm run db:push` - Sincroniza schema diretamente (desenvolvimento)
- `npm run db:studio` - Abre Drizzle Studio para visualizar dados

## Estrutura

### Tabelas

- **users** - Usuários do sistema
- **plans** - Planos de assinatura disponíveis
- **subscriptions** - Assinaturas dos usuários

### Relacionamentos

- Um usuário pode ter múltiplas assinaturas (histórico)
- Cada assinatura está vinculada a um plano
- Assinaturas são removidas em cascata quando o usuário é deletado

## Uso

```typescript
import { db } from '@/db';
import { users, plans, subscriptions } from '@/db/schema';

// Buscar usuários
const allUsers = await db.select().from(users);

// Criar usuário
const newUser = await db.insert(users).values({
  email: 'user@example.com',
  name: 'John Doe'
}).returning();
```