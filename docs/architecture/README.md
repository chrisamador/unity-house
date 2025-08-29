# Unity House - Architecture

## Tech Stack

### Core Technologies
- **Frontend**: Expo (React Native) with Tailwind CSS for styling
- **Backend**: Convex for real-time database and backend functions
- **Authentication**: Clerk with Google and email authentication
- **Package Manager**: Bun
- **Project Structure**: Monorepo

## Monorepo Structure

```
unity-house/
├── apps/
│   ├── mobile/          # Expo mobile application
│   └── web/             # Expo web application
├── packages/
│   ├── api/             # Convex backend
│   │   └── convex/
│   │       ├── schema.ts
│   │       ├── users.ts
│   │       ├── organizations.ts
│   │       ├── entities.ts
│   │       └── pages.ts
│   ├── ui/              # Shared UI components
│   └── config/          # Shared configuration
├── bun.lockb            # Bun lockfile
└── package.json         # Root package.json
```

## Architecture Diagrams

For detailed information on each part of the architecture, see:

- [Frontend Architecture](./frontend.md)
- [Backend Architecture](./backend.md)
