import { z } from 'zod';

const getStatusSchema = z.object({
    taskId: z.string().min(1, "Task ID é obrigatório"),
});

export { getStatusSchema };