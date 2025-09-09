import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_CONVEX_DEPLOYMENT_URL: z.string(),
  EXPO_PUBLIC_CONVEX_SITE_URL: z.string(),
  EXPO_PUBLIC_WORKOS_CLIENT_ID: z.string(),
  EXPO_PUBLIC_WORKOS_REDIRECT_URI: z.string(),
  EXPO_PUBLIC_WEBSITE_TITLE: z.string(),
  EXPO_PUBLIC_ENTITY_ID: z.string(),
});

/**
 * To Review:Note: client env are first created by adding them
 * into the app.config.ts file. We can safely
 * read the .env.local file there and not in files we import
 * within the client build
 *
 * Note: Add new env variables to env.template */
export const clientSafeEnv = envSchema.parse({
  EXPO_PUBLIC_CONVEX_DEPLOYMENT_URL: process.env.EXPO_PUBLIC_CONVEX_DEPLOYMENT_URL,
  EXPO_PUBLIC_CONVEX_SITE_URL: process.env.EXPO_PUBLIC_CONVEX_SITE_URL,
  EXPO_PUBLIC_WORKOS_CLIENT_ID: process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID,
  EXPO_PUBLIC_WORKOS_REDIRECT_URI: process.env.EXPO_PUBLIC_WORKOS_REDIRECT_URI,
  EXPO_PUBLIC_WEBSITE_TITLE: process.env.EXPO_PUBLIC_WEBSITE_TITLE,
  EXPO_PUBLIC_ENTITY_ID: process.env.EXPO_PUBLIC_ENTITY_ID,
});
