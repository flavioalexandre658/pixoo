import { z } from 'zod';

const confirmCreditsSchema = z.object({
    reservationId: z.string().min(1, "Reservation ID é obrigatório"),
    modelId: z.string().min(1, "Model ID é obrigatório"),
    imageId: z.string().optional(),
    description: z.string().optional(),
});

export { confirmCreditsSchema };