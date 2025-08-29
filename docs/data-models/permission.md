# Permission Model

## Overview

The Permission model defines access control for users within entities. It implements a role-based permission system with hierarchical inheritance.

## Schema Definition

The Permission schema is defined in `packages/api/convex/schema.ts` and includes:

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `id` | User this permission applies to |
| `entityId` | `id` | Entity this permission applies to |
| `role` | `string` | Role: "admin", "leadership", "brother", or "public" |
| `grantedBy` | `id` | User who granted this permission |
| `grantedAt` | `number` | Timestamp when permission was granted |

## Permission Audit Trail

Changes to permissions are tracked in the `permissionAudits` table:

| Field | Type | Description |
|-------|------|-------------|
| `permissionId` | `id` | Reference to the permission record |
| `userId` | `string` | User whose permissions changed |
| `entityId` | `string` | Entity for which permissions changed |
| `oldRole` | `string?` | Previous role (null if new permission) |
| `newRole` | `string` | New role assigned |
| `changedBy` | `string` | User who made the change |
| `timestamp` | `number` | When the change occurred |

## Role Hierarchy

Roles are hierarchical, with higher roles inheriting permissions from lower roles:

1. `admin` - Full access to all features and entities
2. `leadership` - Management access within assigned entities
3. `brother` - Standard member access
4. `public` - Limited access to public content

## Indexes

- `by_user`: Index on `userId` for quick lookups of a user's permissions
- `by_entity`: Index on `entityId` for filtering permissions by entity
- `by_user_and_entity`: Compound index for efficient permission checks

## Implementation

For the actual schema implementation, see:
`packages/api/convex/schema.ts`

For permission-related functions, see:
`packages/api/convex/permissions.ts`

For permission utility functions, see:
`packages/api/convex/utils/permissions.ts`
