# Organization Model

## Overview

The Organization model represents Greek organizations using the Unity House platform. Each organization can contain multiple entities (chapters, boards, etc.).

## Schema Definition

The Organization schema is defined in `packages/api/convex/schema.ts` and includes:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Organization name |
| `description` | `string` | Organization description |
| `logoUrl` | `string?` | URL to organization logo (optional) |
| `settings` | `object?` | Configuration object with branding and operational settings |
| `creatorId` | `id` | User ID of the organization creator |

### Settings Object

The settings object can include:

```typescript
{
  primaryColor: string,       // Primary brand color (hex)
  secondaryColor: string,     // Secondary brand color (hex)
  allowPublicRegistration: boolean,  // Whether public users can register
  requireApproval: boolean,   // Whether new members require approval
}
```

## Indexes

- `by_creator`: Index on `creatorId` for filtering organizations by creator

## Implementation

For the actual schema implementation, see:
`packages/api/convex/schema.ts`

For organization-related functions, see:
`packages/api/convex/organizations.ts`
