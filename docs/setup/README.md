# Unity House - Setup & Configuration

This directory contains documentation for setting up and configuring the Unity House application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Development Workflow](#development-workflow)
5. [Deployment](#deployment)

## Prerequisites

Before setting up Unity House, ensure you have the following installed:

- Node.js (v18+)
- Bun (latest version)
- Git
- Expo CLI (`npm install -g expo-cli`)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/unity-house.git
   cd unity-house
   ```

2. Install dependencies:
   ```bash
   bun install
   bun add dotenv-mono --dev
   ```

3. Set up environment variables (see [Environment Configuration](#environment-configuration))

4. Start the development server:
   ```bash
   bun run dev
   ```

## Environment Configuration

Unity House uses a single `.env.local` file at the project root with dotenv-mono to share environment variables across packages:

### Environment Variables

Create a `.env.local` file in the root directory of the project with the following variables:

```
# Authentication (WorkOS)
NEXT_PUBLIC_WORKOS_CLIENT_ID=client_...
WORKOS_API_KEY=sk_...
WORKOS_REDIRECT_URI=https://...
EXPO_PUBLIC_WORKOS_CLIENT_ID=client_...

# Backend (Convex)
CONVEX_DEPLOYMENT=...
CONVEX_URL=...

# AI Features (OpenAI)
OPENAI_API_KEY=sk_...
```

### Using dotenv-mono

The project uses `dotenv-mono` and `znv` to load and validate environment variables from the root `.env.local` file. For detailed setup instructions, see [Environment Configuration](./env.md).

## Development Workflow

### Running the App

```bash
cd packages/app
bun run start
```

This will start the Expo development server, which can run both the mobile app (via Expo Go) and the web app.

### Running the Backend

```bash
cd packages/api
bun run dev
```

## Deployment

### Web Deployment

The web application can be deployed to Vercel:

```bash
cd packages/app
bun run deploy:web
```

### Mobile Deployment

Build the mobile app using EAS Build:

```bash
cd packages/app
eas build --platform all
```

### Backend Deployment

Deploy the Convex backend:

```bash
cd packages/api
npx convex deploy
```

## Custom Domain Configuration

To set up custom domains for entities:

1. Configure DNS settings for each domain to point to your hosting provider
2. Update the `domainURL` field for each entity in the database
3. Configure your hosting provider to handle multiple domains
4. Ensure SSL certificates are set up for each domain
