import { z } from "zod";

const getImagesHistorySchema = z.object({
  limit: z.number().int().positive().optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
});

export { getImagesHistorySchema };
