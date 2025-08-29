# Entity Model

## Overview

The Entity model represents organizational units within Unity House, such as chapters, boards, committees, etc. Entities can be hierarchical, with parent-child relationships.

## Schema Definition

The Entity schema is defined in `packages/api/convex/schema.ts` and includes:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Entity name |
| `description` | `string` | Entity description |
| `entityParentId` | `id?` | Parent entity ID for hierarchical structure (null if top-level) |
| `organizationId` | `id` | Organization this entity belongs to |
| `location` | `object?` | Optional location information |
| `contact` | `object?` | Optional contact information |
| `entityType` | `string?` | Entity type (e.g., chapter, board, committee) |
| `domainURL` | `string?` | Custom domain URL for this entity |

## Domain-based Entity Resolution

Each entity can have its own unique domain through the `domainURL` field. When users visit that domain, the application will:

1. Parse the host URL from the incoming request
2. Look up the entity with a matching `domainURL`
3. Display the appropriate entity information and content

This allows each chapter or entity to have its own branded web presence while still being part of the Unity House platform.

## Implementation

For domain resolution, the application will:

1. Check the incoming host URL in the web application
2. Query the database for an entity with a matching `domainURL`
3. Set the current entity context based on the result
4. Display entity-specific content, styling, and branding

## Indexes

- `by_parent`: Index on `entityParentId` for quick lookups of child entities
- `by_organization`: Index on `organizationId` for filtering entities by organization
- `by_domain`: Index on `domainURL` for quick domain-based entity resolution

## Implementation

For the actual schema implementation, see:
`packages/api/convex/schema.ts`

For entity-related functions, see:
`packages/api/convex/entities.ts`
