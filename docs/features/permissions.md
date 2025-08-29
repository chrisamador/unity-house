# Permission System

## Overview

Unity House implements a comprehensive role-based permission system that controls access to features, entities, and content. The permission system ensures that users can only access and modify resources according to their assigned roles.

## Role Hierarchy

The permission system uses a hierarchical role structure:

1. **Admin**: Full access to all features and entities
2. **Leadership**: Management access within assigned entities
3. **Brother**: Standard member access
4. **Public**: Limited access to public content

Higher roles inherit all permissions from lower roles.

## Permission Assignment

Permissions are assigned at the entity level:

- **Organization-level**: Admin role for organization creators
- **Entity-level**: Leadership, brother, or public roles for entity members

## User Approval Process

All users, particularly brothers, need to be approved by a leadership member or administrator:

1. New users register and are initially unapproved (`approvedBy: null`)
2. Only users with "leadership" or "admin" roles can approve other users
3. Once approved, the `approvedBy` field is set to the ID of the approving user
4. Approved users gain access based on their assigned roles

## Permission Enforcement

Permissions are enforced at multiple levels:

### Backend Enforcement

All Convex functions that access or modify data include permission checks:

```typescript
// Implementation in packages/api/convex/utils/permissions.ts
export async function hasRole(
  db: DatabaseReader, 
  userId: string, 
  entityId: string, 
  requiredRole: string
): Promise<boolean> {
  // Admin has access to everything
  const isAdmin = await isUserAdmin(db, userId);
  if (isAdmin) return true;
  
  const permission = await db
    .query('permissions')
    .withIndex('by_user_and_entity', (q) => 
      q.eq('userId', userId).eq('entityId', entityId)
    )
    .first();
  
  if (!permission) return false;
  
  const userRoleIndex = PERMISSION_LEVELS.indexOf(permission.role);
  const requiredRoleIndex = PERMISSION_LEVELS.indexOf(requiredRole);
  
  return userRoleIndex >= requiredRoleIndex;
}

// Permission middleware
export const withPermission = (requiredRole: string) => {
  return (inner: MutationCtx | QueryCtx) => 
    async (ctx: MutationCtx | QueryCtx, args: { entityId: Id<"entities"> }) => {
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

### Frontend Enforcement

The frontend uses permission hooks to conditionally render UI elements:

```typescript
// Implementation in packages/ui/src/hooks/usePermission.ts
export function useHasPermission(entityId: string, requiredRole: string) {
  const user = useUser();
  const { data: permission } = useQuery(api.permissions.getUserPermission, {
    userId: user?.id,
    entityId,
  });
  
  if (!permission) return false;
  
  const userRoleIndex = PERMISSION_LEVELS.indexOf(permission.role);
  const requiredRoleIndex = PERMISSION_LEVELS.indexOf(requiredRole);
  
  return userRoleIndex >= requiredRoleIndex;
}
```

## Permission Auditing

All permission changes are tracked in the `permissionAudits` table:

- Who made the change
- What permissions were changed
- When the change occurred
- Previous and new role values

## Entity-specific Permissions

Permissions are scoped to specific entities, allowing for fine-grained access control:

- A user can have different roles in different entities
- Entity permissions do not automatically grant access to child entities
- Parent entity permissions can be configured to cascade to child entities

## Domain-based Access

When accessing an entity through its custom domain (`domainURL`), permissions are still enforced:

1. The domain resolves to a specific entity
2. User permissions for that entity are checked
3. Content is filtered based on the user's role and the content's visibility

## Implementation Files

- Permission schema: `packages/api/convex/schema.ts`
- Permission functions: `packages/api/convex/permissions.ts`
- Permission utilities: `packages/api/convex/utils/permissions.ts`
- Frontend permission hooks: `packages/ui/src/hooks/usePermission.ts`
