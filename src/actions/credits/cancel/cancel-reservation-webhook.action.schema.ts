import { z } from 'zod';

const cancelReservationWebhookSchema = z.object({
    userId: z.string().min(1, "User ID é obrigatório"),
    reservationId: z.string().min(1, "Reservation ID é obrigatório"),
    reason: z.string().optional(),
});

export { cancelReservationWebhookSchema };