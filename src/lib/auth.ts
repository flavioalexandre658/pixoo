import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../db";
import * as schemas from "../../db/schema";
export const auth = betterAuth({
  trustedOrigins: ["http://localhost:3000", "http://localhost:3000"],
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: schemas,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});

export type Session = typeof auth.$Infer.Session;
