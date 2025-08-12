import { z } from "zod";

const getModelCostSchema = z.object({
  modelId: z.string(),
});

export { getModelCostSchema };