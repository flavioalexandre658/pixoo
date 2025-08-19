import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq, and, lt, isNull, desc } from "drizzle-orm";
import { userCredits, creditTransactions, subscriptions } from "@/db/schema";

export async function GET(request: NextRequest) {
  try {
    // Verificar se a requisição vem do Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Iniciando renovação automática de créditos gratuitos...");

    // Buscar todos os usuários que precisam de renovação
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Buscar usuários sem assinatura ativa
    const usersWithoutSubscription = await db
      .select({
        userId: userCredits.userId,
        balance: userCredits.balance,
      })
      .from(userCredits)
      .leftJoin(
        subscriptions,
        and(
          eq(subscriptions.userId, userCredits.userId),
          eq(subscriptions.status, "active")
        )
      )
      .where(
        // Usuários sem assinatura ativa
        isNull(subscriptions.id)
      );

    let renewedCount = 0;
    const errors: string[] = [];

    for (const user of usersWithoutSubscription) {
      try {
        // Verificar última renovação deste usuário
        const lastRenewal = await db.query.creditTransactions.findFirst({
          where: and(
            eq(creditTransactions.userId, user.userId),
            eq(
              creditTransactions.description,
              "Renovação automática de créditos gratuitos - flux-schnell"
            )
          ),
          orderBy: [desc(creditTransactions.createdAt)],
        });

        // Se teve renovação nas últimas 24 horas, pular
        if (lastRenewal && lastRenewal.createdAt > twentyFourHoursAgo) {
          continue;
        }

        // Renovar créditos para 10
        const newBalance = user.balance + 10;

        await db
          .update(userCredits)
          .set({
            balance: newBalance,
            updatedAt: now,
          })
          .where(eq(userCredits.userId, user.userId));

        // Registrar transação
        await db.insert(creditTransactions).values({
          id: crypto.randomUUID(),
          userId: user.userId,
          type: "bonus",
          amount: 10,
          description:
            "Renovação automática de créditos gratuitos - flux-schnell",
          balanceAfter: newBalance,
          createdAt: now,
        });

        renewedCount++;
      } catch (error) {
        console.error(
          `Erro ao renovar créditos para usuário ${user.userId}:`,
          error
        );
        errors.push(
          `Usuário ${user.userId}: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`
        );
      }
    }

    console.log(`✅ Renovação concluída: ${renewedCount} usuários renovados`);

    if (errors.length > 0) {
      console.error("❌ Erros durante a renovação:", errors);
    }

    return NextResponse.json({
      success: true,
      message: `Renovação concluída: ${renewedCount} usuários renovados`,
      renewedCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("❌ Erro na renovação automática:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
