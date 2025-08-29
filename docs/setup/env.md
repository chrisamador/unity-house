# Environment Configuration

This guide explains how to configure environment variables for Unity House using dotenv-mono and znv.

## Installation

Install the required dependencies:

```bash
bun add dotenv-mono --dev
bun add znv --dev
```

## Environment Files

### .env.template

Unity House uses an `.env.template` file at the project root that should be committed to the repository. This file serves as documentation for all required environment variables without containing any sensitive values.

Purpose of `.env.template`:
- Documents all required environment variables
- Provides default values for non-sensitive variables
- Helps new developers set up their environment
- Gets committed to version control
- Serves as a reference when environment variables change

### .env.local

The actual environment variables are stored in a `.env.local` file at the project root (which is gitignored). This file contains all environment variables needed across packages, including sensitive values.

Example `.env.local`:

```
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...

# Backend (Convex)
CONVEX_DEPLOYMENT=...
CONVEX_URL=...

# Frontend Configuration
FRONTEND_WEB_DOMAIN=localhost:3000
EXPO_PUBLIC_SERVER_PORT=3000
EXPO_PUBLIC_BACKEND_SERVER_URL=http://localhost:3000
EXPO_PUBLIC_WORKING_ENV=local

# Database Configuration
DATABASE_URI=postgresql://postgres:postgres@localhost:5432/unity_house
REDIS_URI=redis://localhost:6379
ELASTICSEARCH_URI=http://localhost:9200

# Cloudflare Images
CLOUDFLARE_IMAGES_ACCOUNT_ID=...
EXPO_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH=...
CLOUDFLARE_API_TOKEN=...

# Email
RESEND_API_KEY=...

# Authentication
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
BETTER_AUTH_SECRET=...

# GCP
GCP_SA_KEY_BASE64=...
GCS_BUCKET_NAME=...

# Database backup
DB_BACKUP_MODE=local
```

## Frontend Configuration

For the frontend (Expo app), import dotenv-mono at the entry point:

```typescript
// packages/app/src/app/_layout.tsx
import "dotenv-mono/load";

// Rest of your code
```

## Backend Configuration with znv

For the backend, we use znv to validate and type environment variables:

```typescript
// packages/api/src/env.ts
import * as dotenv from "dotenv-mono";
import { parseEnv, port, z } from "znv";

// Load the environment variables from .env.local files on local development
// On non-local, variables are added via the docker container deployment
// so no .env file is used
dotenv.config({ extension: "local" });

if (process.env.NODE_ENV === "test") {
  process.env.EXPO_PUBLIC_WORKING_ENV = "test";
}

/**
 * Note: Remember to add any new env variables to env.template
 * when creating new env variables
 */
export const env = parseEnv(process.env, {
  FRONTEND_WEB_DOMAIN: z.string(),
  EXPO_PUBLIC_SERVER_PORT: port(),
  EXPO_PUBLIC_BACKEND_SERVER_URL: z.string(),
  EXPO_PUBLIC_WORKING_ENV: z.enum([
    "local",
    "test",
    "dev",
    "staging",
    "production",
  ]),
  DATABASE_URI: z.string(),
  REDIS_URI: z.string(),
  ELASTICSEARCH_URI: z.string(),
  // Cloudflare Images configuration
  CLOUDFLARE_IMAGES_ACCOUNT_ID: z.string(),
  EXPO_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH: z.string(),
  CLOUDFLARE_API_TOKEN: z.string(),
  // End Cloudflare Images configuration
  RESEND_API_KEY: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  // GCP
  GCP_SA_KEY_BASE64: z.string(),
  GCS_BUCKET_NAME: z.string(),
  // Database backup script
  DB_BACKUP_MODE: z.enum(["local", "gcs"]),
});
```

## Benefits of Using znv

1. **Type Safety**: All environment variables are properly typed
2. **Validation**: Variables are validated at runtime to ensure they meet requirements
3. **Documentation**: Schema serves as documentation for required environment variables
4. **Default Values**: Can provide default values for optional variables
5. **Error Handling**: Clear error messages when variables are missing or invalid

## Setting Up Your Environment

### For New Developers

1. Copy the `.env.template` file to create your `.env.local` file:
   ```bash
   cp .env.template .env.local
   ```

2. Fill in the required values in your `.env.local` file

3. Run the project setup which will use dotenv-mono to sync environment variables:
   ```bash
   bun install
   ```

### When Adding New Environment Variables

1. Add the new variable to the `.env.template` file (without sensitive values)
2. Add the new variable to your local `.env.local` file with the actual value
3. Add the variable to the znv schema in `packages/api/src/env.ts`
4. Run `bun run dotenv-mono sync` to update all packages

### Example .env.template

```
# This file documents required environment variables
# Copy to .env.local and fill in values
# DO NOT add sensitive values to this template file

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=

# Frontend Configuration
FRONTEND_WEB_DOMAIN=localhost:3000
EXPO_PUBLIC_SERVER_PORT=3000
EXPO_PUBLIC_BACKEND_SERVER_URL=http://localhost:3000
EXPO_PUBLIC_WORKING_ENV=local

# Database Configuration
DATABASE_URI=
REDIS_URI=
ELASTICSEARCH_URI=

# Cloudflare Images
CLOUDFLARE_IMAGES_ACCOUNT_ID=
EXPO_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH=
CLOUDFLARE_API_TOKEN=

# Email
RESEND_API_KEY=

# Authentication
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
BETTER_AUTH_SECRET=

# GCP
GCP_SA_KEY_BASE64=
GCS_BUCKET_NAME=

# Database backup
DB_BACKUP_MODE=local
```

## Usage in Code

After configuration, you can use environment variables:

### In Frontend (Expo)

```typescript
// Access EXPO_PUBLIC_* variables directly
const apiUrl = process.env.EXPO_PUBLIC_BACKEND_SERVER_URL;
```

### In Backend

```typescript
import { env } from "../env";

// Access typed and validated variables
const databaseUri = env.DATABASE_URI;
const workingEnv = env.EXPO_PUBLIC_WORKING_ENV;
```
