# Unity House - Architecture

## Tech Stack

### Core Technologies
- **Frontend**: Expo (React Native) with NativeWind for styling
- **Backend**: Convex for real-time database and backend functions
- **Authentication**: Clerk with Google and email authentication
- **Package Manager**: Bun
- **Project Structure**: Monorepo

## Monorepo Structure

```
unity-house/
└── packages/
    ├── app/             # Expo application (for mobile and web)
    │   └── src/        # Source code directory
    │       ├── app/     # Expo Router app directory
    │       │   ├── (auth)/  # Authentication routes
    │       │   ├── (tabs)/  # Main app tabs
    │       │   └── [...]    # Other route groups
    │       ├── components/  # App-specific components
    │       ├── hooks/       # App-specific hooks
    │       ├── web/         # Web-specific configuration
    │       └── ui/          # Shared UI components
    │           ├── components/  # Base components
    │           ├── hooks/       # Shared hooks
    │           └── styles/      # Shared styles
    ├── api/             # Convex backend
    └── config/          # Shared configuration
```

## Architecture Diagrams

For detailed information on each part of the architecture, see:

- [Frontend Architecture](./frontend.md)
- [Backend Architecture](./backend.md)
