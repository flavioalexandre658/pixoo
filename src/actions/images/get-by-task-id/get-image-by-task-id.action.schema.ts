import { z } from 'zod';

const getImageByTaskIdSchema = z.object({
    taskId: z.string().min(1, "Task ID é obrigatório"),
});

export { getImageByTaskIdSchema };