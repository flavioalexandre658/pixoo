import { headers } from 'next/headers';
import { createSafeActionClient } from 'next-safe-action';

import { auth } from '@/lib/auth';

export const actionClient = createSafeActionClient();

export const authActionClient = actionClient.use(async ({ next }) => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return {
            success: false,
            errors: {
                _form: ['Unauthorized'],
            },
        };

    }

    return next({ ctx: { userId: session.user.id } });
});