# Page Model

## Overview

The Page model represents dynamic content pages created by users. Pages can contain rich content with various components and are associated with specific entities.

## Schema Definition

The Page schema is defined in `packages/api/convex/schema.ts` and includes:

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Page title |
| `content` | `string` | JSON stringified content (rich text/components) |
| `authorId` | `id` | User ID of the page creator |
| `entityId` | `id` | Entity this page belongs to |
| `isPublic` | `boolean` | Whether the page is publicly accessible |
| `status` | `enum` | Page status: "draft", "published", or "archived" |
| `pageType` | `string?` | Template type (optional) |
| `tags` | `array<string>?` | Categorization tags (optional) |
| `lastModified` | `number` | Timestamp of last modification |

## Page Revisions

Each page has a version history stored in the `pageRevisions` table:

| Field | Type | Description |
|-------|------|-------------|
| `pageId` | `id` | Reference to the original page |
| `content` | `string` | Content at this revision point |
| `authorId` | `id` | User who made the revision |
| `revisionNumber` | `number` | Sequential revision number |
| `comment` | `string?` | Description of changes (optional) |

## Content Structure

The `content` field stores a JSON stringified representation of the page content. The structure follows a block-based approach:

```typescript
{
  blocks: [
    {
      id: string,
      type: string,  // "text", "image", "video", "columns", etc.
      data: object,  // Block-specific data
      children: Block[]  // For nested blocks
    }
  ],
  version: string  // Schema version
}
```

## Indexes

- `by_author`: Index on `authorId` for filtering pages by creator
- `by_entity`: Index on `entityId` for filtering pages by entity
- `by_visibility`: Index on `isPublic` for filtering public/private pages
- `by_status`: Index on `status` for filtering by publication status
- `by_entity_and_status`: Compound index for efficient entity page listing

## Implementation

For the actual schema implementation, see:
`packages/api/convex/schema.ts`

For page-related functions, see:
`packages/api/convex/pages.ts`
