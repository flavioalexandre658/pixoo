import { z } from "zod";

export const createCreditPackageCheckoutSchema = z.object({
  packageCode: z.string().min(1, "Código do pacote é obrigatório"),
  currency: z.enum(["BRL", "USD"], {
    message: "Moeda deve ser BRL ou USD",
  }),
});

export type CreateCreditPackageCheckoutInput = z.infer<typeof createCreditPackageCheckoutSchema>;