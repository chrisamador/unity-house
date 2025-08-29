# Authentication System

## Overview

Unity House uses Clerk for authentication, providing a secure and feature-rich authentication experience across web and mobile platforms. The authentication system integrates with Convex for backend authorization and user management.

## Features

- **Multiple Authentication Methods**:
  - Email/password authentication
  - Google OAuth
  - (Expandable to other OAuth providers)
- **Cross-platform Support**:
  - Web authentication via Clerk React
  - Mobile authentication via Clerk Expo
- **User Approval Workflow**:
  - New users start with pending status
  - Leadership or admin approval required
  - Approval tracking via `approvedBy` field

## Implementation

### Configuration

Authentication configuration is stored in environment variables:

```
# Web environment variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Mobile environment variables
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
```

### Web Authentication

Web authentication is implemented using Clerk React:

```typescript
// Implementation in apps/web/app/_layout.tsx
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider>
  );
}
```

### Mobile Authentication

Mobile authentication is implemented using Clerk Expo:

```typescript
// Implementation in apps/mobile/app/_layout.tsx
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

// SecureStore implementation for token storage
const tokenCache = {
  getToken: (key) => SecureStore.getItemAsync(key),
  saveToken: (key, value) => SecureStore.setItemAsync(key, value),
};

export default function RootLayout() {
  return (
    <ClerkProvider 
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      {/* App content */}
    </ClerkProvider>
  );
}
```

### Authentication Flow

1. **User Registration**:
   - User signs up with email/password or OAuth
   - User completes profile information
   - User record created in Convex with `approvedBy: null`

2. **User Approval**:
   - Admin or leadership member reviews new users
   - Approves user by setting `approvedBy` field to their user ID
   - User gains access based on assigned role

3. **Authentication Guards**:
   - Protected routes require authentication
   - Role-based access control for specific features
   - Permission checks for entity-specific actions

### Convex Integration

Clerk integrates with Convex for backend authorization:

```typescript
// Implementation in packages/api/convex/auth.ts
import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { ConvexError } from "convex/values";

export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    return user;
  },
});

export const createUser = mutation({
  args: {
    firstName: v.string(),
    lastName: v.optional(v.string()),
    school: v.string(),
    graduationDate: v.string(),
    memberType: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    if (existingUser) {
      throw new ConvexError("User already exists");
    }

    // Create new user (initially unapproved)
    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      firstName: args.firstName,
      lastName: args.lastName,
      school: args.school,
      graduationDate: new Date(args.graduationDate),
      memberType: args.memberType,
      organizationIds: [],
      entityIds: [],
      approvedBy: null, // Initially unapproved
    });
  },
});
```

## User Approval Process

The user approval process is implemented in Convex:

```typescript
// Implementation in packages/api/convex/users.ts
export const approveUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get current user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    // Check if approver is admin or leadership
    const approver = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    if (!approver || !["admin", "leadership"].includes(approver.memberType)) {
      throw new ConvexError("Insufficient permissions to approve users");
    }

    // Update user with approver ID
    return await ctx.db.patch(args.userId, {
      approvedBy: approver._id,
    });
  },
});
```

## Security Considerations

- **Token Storage**: Secure storage of authentication tokens
  - Web: HTTP-only cookies
  - Mobile: Expo SecureStore
- **Session Management**: Automatic session refresh and expiration
- **CSRF Protection**: Built-in protection against cross-site request forgery
- **OAuth Security**: PKCE flow for mobile OAuth
- **Permission Validation**: Backend validation of all permission changes
