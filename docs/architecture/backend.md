# Backend Architecture

## Overview

Unity House uses Convex as its backend platform, providing a real-time database, serverless functions, and authentication integration. The backend architecture is designed to be modular, secure, and scalable.

## Technology Stack

- **Database**: Convex (document-based NoSQL)
- **Functions**: Convex serverless functions (TypeScript)
- **Authentication**: Clerk with Convex integration
- **File Storage**: Convex file storage

## Directory Structure

```
packages/api/
├── convex/
│   ├── schema.ts              # Database schema definition
│   ├── auth.ts                # Authentication functions
│   ├── users.ts               # User management functions
│   ├── organizations.ts       # Organization management functions
│   ├── entities.ts            # Entity management functions
│   ├── pages.ts               # Page management functions
│   ├── permissions.ts         # Permission management functions
│   └── utils/
│       ├── permissions.ts     # Permission utility functions
│       ├── validation.ts      # Input validation helpers
│       └── errors.ts          # Error handling utilities
```

## Database Schema

The database schema is defined in `schema.ts` and includes the following tables:

- `users`: User profiles and metadata
- `organizations`: Greek organizations
- `entities`: Chapters, boards, and other organizational units
- `pages`: Dynamic content pages
- `pageRevisions`: Version history for pages
- `permissions`: User role assignments
- `permissionAudits`: Audit trail for permission changes

For detailed schema information, see the [Data Models](../data-models/README.md) documentation.

## API Functions

### Query Functions

Query functions retrieve data from the database and are automatically reactive:

- `getUser`: Get user profile by ID
- `listOrganizations`: List organizations for a user
- `listEntities`: List entities for an organization
- `getEntityByDomain`: Find an entity by its domain URL
- `listPages`: List pages for an entity
- `getPage`: Get page by ID
- `getPageRevisions`: Get revision history for a page

### Mutation Functions

Mutation functions modify data in the database:

- `createUser`: Create a new user profile
- `updateUser`: Update user profile
- `approveUser`: Approve a user (sets approvedBy field)
- `createOrganization`: Create a new organization
- `updateOrganization`: Update organization details
- `createEntity`: Create a new entity
- `updateEntity`: Update entity details
- `createPage`: Create a new page
- `updatePage`: Update page content
- `publishPage`: Change page status to published
- `archivePage`: Archive a page
- `assignPermission`: Assign a role to a user for an entity

## Permission Enforcement

All data access is secured through permission checks:

1. Authentication via Clerk integration
2. Permission middleware for function execution
3. Role-based access control for entities and pages
4. Audit logging for permission changes

Example permission middleware:

```typescript
// Implementation in packages/api/convex/utils/permissions.ts
export const withPermission = (requiredRole: string) => {
  return (
    inner: MutationCtx | QueryCtx
  ) => async (
    ctx: MutationCtx | QueryCtx,
    args: { entityId: Id<"entities"> }
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    const hasPermission = await hasRole(
      ctx.db, 
      userId, 
      args.entityId, 
      requiredRole
    );
    
    if (!hasPermission) throw new Error("Insufficient permissions");
    
    return inner(ctx, args);
  };
};
```

## Domain-based Entity Resolution

The backend supports resolving entities by their custom domain:

```typescript
// Implementation in packages/api/convex/entities.ts
export const getEntityByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("entities")
      .withIndex("by_domain", (q) => q.eq("domainURL", args.domain))
      .first();
  },
});
```

## Error Handling

The backend implements consistent error handling:

- Validation errors for invalid inputs
- Permission errors for unauthorized access
- Not found errors for missing resources
- Detailed error messages for debugging
- Error logging for monitoring

## Integration with Clerk

Authentication is handled through Clerk integration:

- User identity verification
- Role-based access control
- Session management
- OAuth providers (Google, etc.)

For detailed authentication information, see the [Authentication](../features/authentication.md) documentation.
