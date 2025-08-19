"use server";

import { db } from "@/db";
import { actionClient } from "@/lib/safe-action";
import { creditPackages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCreditPackagesByCurrencySchema } from "./get-credit-packages-by-currency.action.schema";

export const getCreditPackagesByCurrency = actionClient
  .inputSchema(getCreditPackagesByCurrencySchema)
  .action(async ({ parsedInput }) => {
    try {
      const { currency } = parsedInput;

      console.log(`🔄 Buscando pacotes de créditos para moeda: ${currency}`);

      // Buscar pacotes ativos para a moeda especificada
      const packagesList = await db
        .select()
        .from(creditPackages)
        .where(
          and(
            eq(creditPackages.currency, currency),
            eq(creditPackages.isActive, "1")
          )
        )
        .orderBy(creditPackages.priceInCents);

      if (!packagesList.length) {
        return {
          success: false,
          errors: {
            _form: [
              `Nenhum pacote de créditos encontrado para a moeda ${currency}`,
            ],
          },
        };
      }

      // Processar dados dos pacotes
      const processedPackages = packagesList.map((pkg) => ({
        ...pkg,
        priceFormatted:
          currency === "BRL"
            ? `R$ ${(pkg.priceInCents / 100).toFixed(2).replace(".", ",")}`
            : `$${(pkg.priceInCents / 100).toFixed(2)}`,
        lookupKey: `${pkg.code}_${currency.toLowerCase()}`, // Lookup key para buscar preços no Stripe
      }));

      console.log(
        `✅ ${processedPackages.length} pacotes encontrados para ${currency}`
      );
      return {
        success: true,
        data: processedPackages,
      };
    } catch (error) {
      console.error("❌ Erro ao buscar pacotes de créditos:", error);
      return {
        success: false,
        errors: {
          _form: [
            error instanceof Error ? error.message : "Erro interno do servidor",
          ],
        },
      };
    }
  });
