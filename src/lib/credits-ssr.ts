import { auth } from '@/lib/auth';
import { db } from '@/db';
import { creditTransactions, userCredits } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { UserCreditsSummary } from '@/interfaces/credits.interface';
import { headers } from 'next/headers';

/**
 * Busca os créditos do usuário no servidor (SSR)
 * Esta função é executada no servidor e pode ser usada em Server Components
 */
export async function getCreditsSSR(): Promise<UserCreditsSummary | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      return null;
    }

    const userId = session.user.id;

    // Buscar dados do usuário na tabela userCredits
    const userCredit = await db.query.userCredits.findFirst({
      where: eq(userCredits.userId, userId),
    });

    // Se não existe registro, criar um com valores zerados
    if (!userCredit) {
      await db.insert(userCredits).values({
        id: crypto.randomUUID(),
        userId,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
      });
    }

    const summary = {
      balance: userCredit?.balance || 0,
      totalEarned: userCredit?.totalEarned || 0,
      totalSpent: userCredit?.totalSpent || 0,
    };

    // Buscar transações recentes
    const recentTransactions = await db
      .select({
        id: creditTransactions.id,
        userId: creditTransactions.userId,
        amount: creditTransactions.amount,
        description: creditTransactions.description,
        type: creditTransactions.type,
        balanceAfter: creditTransactions.balanceAfter,
        createdAt: creditTransactions.createdAt,
      })
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(10);

    return {
      balance: summary.balance,
      totalEarned: summary.totalEarned,
      totalSpent: summary.totalSpent,
      recentTransactions: recentTransactions.map(transaction => ({
        id: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type as 'earned' | 'spent' | 'bonus' | 'refund',
        balanceAfter: transaction.balanceAfter,
        createdAt: transaction.createdAt,
      })),
    };
  } catch (error) {
    console.error('Erro ao buscar créditos no SSR:', error);
    return null;
  }
}