import { z } from 'zod';

const confirmCreditsWebhookSchema = z.object({
    userId: z.string().min(1, "User ID é obrigatório"),
    reservationId: z.string().min(1, "Reservation ID é obrigatório"),
    modelId: z.string().min(1, "Model ID é obrigatório"),
    imageId: z.string().optional(),
    description: z.string().optional(),
});

export { confirmCreditsWebhookSchema };