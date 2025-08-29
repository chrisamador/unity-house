# Unity House Documentation Summary

This document provides a quick overview of the documentation structure after breaking it into multiple files.

## Documentation Structure

```
docs/
├── README.md                      # Main documentation entry point
├── overview.md                    # Application purpose and core features
├── architecture/
│   ├── README.md                  # Architecture overview
│   ├── frontend.md                # Frontend architecture with Expo
│   └── backend.md                 # Backend architecture with Convex
├── data-models/
│   ├── README.md                  # Data models overview
│   ├── user.md                    # User model with approvedBy field
│   ├── organization.md            # Organization model
│   ├── entity.md                  # Entity model with domainURL field
│   ├── page.md                    # Dynamic page content model
│   └── permission.md              # Permission model
├── features/
│   ├── README.md                  # Features overview
│   ├── authentication.md          # Authentication with Clerk
│   ├── permissions.md             # Role-based permission system
│   ├── dynamic-pages.md           # Dynamic page creation system
│   └── ai-implementation.md       # AI features implementation
└── setup/
    └── README.md                  # Setup and configuration guide
```

## Key Updates

1. **Schema Updates**:
   - Added `approvedBy` column to User schema for member approval workflow
   - Added `domainURL` column to Entity schema for custom domain support

2. **Documentation Organization**:
   - Split documentation into logical sections
   - Created dedicated files for each major component
   - Added cross-references between related documents

3. **Implementation Details**:
   - Moved code examples to implementation files
   - Documentation now references code files rather than containing code
   - Schema definitions are in `packages/api/convex/schema.ts`

4. **Monorepo Structure**:
   - Single Expo app in `packages/app` targeting both mobile and web
   - Source code organized in `packages/app/src`
   - Shared UI components in `packages/app/src/ui`
   - Convex backend in `packages/api`

## Navigation Guide

- Start with [README.md](./README.md) for an overview
- For technical architecture, see the [architecture](./architecture/README.md) directory
- For data models and schema, see the [data-models](./data-models/README.md) directory
- For feature details, see the [features](./features/README.md) directory
- For setup instructions, see the [setup](./setup/README.md) directory
  - [Environment Configuration](./setup/env.md)
