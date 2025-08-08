import { z } from 'zod';

const cancelReservationSchema = z.object({
    reservationId: z.string().min(1, "ID da reserva é obrigatório"),
    reason: z.string().optional(),
});

export { cancelReservationSchema };