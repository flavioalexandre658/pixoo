import { z } from "zod";

export const getCreditPackagesByCurrencySchema = z.object({
  currency: z.enum(["USD", "BRL"]).default("USD"),
});

export type GetCreditPackagesByCurrencyInput = z.infer<
  typeof getCreditPackagesByCurrencySchema
>;
