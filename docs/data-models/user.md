# User Model

## Overview

The User model represents members of the Unity House platform. Users can belong to organizations and entities with different roles and permissions.

## Schema Definition

The User schema is defined in `packages/api/convex/schema.ts` and includes:

| Field | Type | Description |
|-------|------|-------------|
| `workosId` | `string` | WorkOS user ID for linking with auth system |
| `firstName` | `string` | User's first name |
| `lastName` | `string?` | User's last name (optional) |
| `school` | `string` | Educational institution name |
| `graduationDate` | `date` | Date of graduation |
| `memberType` | `enum` | Role in the organization: "admin", "leadership", "brother", or "public" |
| `profilePicture` | `string?` | URL to profile image (optional) |
| `organizationIds` | `array<id>` | Organizations this user belongs to |
| `entityIds` | `array<id>` | Entities this user belongs to |
| `approvedBy` | `id?` | ID of the user who approved this member (null until approved) |

## Indexes

- `by_workos_id`: Index on `workosId` for quick lookups by WorkOS ID
- `by_member_type`: Index on `memberType` for filtering users by role

## Approval Process

All users, particularly brothers, need to be approved by a leadership member or administrator before gaining full access to the platform. The `approvedBy` field tracks which user approved the membership.

- New users start with `approvedBy: null`
- Only users with "leadership" or "admin" roles can approve other users
- Once approved, the `approvedBy` field is set to the ID of the approving user

## Authentication

User authentication is handled by WorkOS. The `workosId` field links the Convex user record with the WorkOS authentication system.

## Implementation

For the actual schema implementation, see:
`packages/api/convex/schema.ts`

For user-related functions, see:
`packages/api/convex/users.ts`
