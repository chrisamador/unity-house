// packages/api/convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - extends Clerk user data
  users: defineTable({
    // Clerk user ID for linking with auth system
    clerkId: v.string(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    school: v.string(),
    graduationDate: v.string(),
    // Member type: admin, leadership, brother, public
    memberType: v.union(
      v.literal("admin"),
      v.literal("leadership"),
      v.literal("brother"),
      v.literal("public")
    ),
    // Optional profile picture URL
    profilePicture: v.optional(v.string()),
    // Organizations this user belongs to
    organizationIds: v.array(v.id("organizations")),
    // Entities this user belongs to
    entityIds: v.array(v.id("entities")),
    // ID of the user who approved this member (null until approved)
    approvedBy: v.optional(v.id("users")),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_member_type", ["memberType"]),

  // Organizations table
  organizations: defineTable({
    name: v.string(),
    description: v.string(),
    // URL to logo image
    logoUrl: v.optional(v.string()),
    // Organization settings as a JSON object
    settings: v.optional(
      v.object({
        primaryColor: v.optional(v.string()),
        secondaryColor: v.optional(v.string()),
        allowPublicRegistration: v.optional(v.boolean()),
        requireApproval: v.optional(v.boolean()),
      })
    ),
    // Creator of the organization
    creatorId: v.id("users"),
  }).index("by_creator", ["creatorId"]),

  // Entities table (chapters, boards, etc.)
  entities: defineTable({
    name: v.string(),
    description: v.string(),
    // Parent entity for hierarchical structure (null if top-level)
    entityParentId: v.optional(v.id("entities")),
    // Organization this entity belongs to
    organizationId: v.id("organizations"),
    // Custom domain URL for this entity
    domainURL: v.optional(v.string()),
    // Location information
    location: v.optional(
      v.object({
        address: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        zipCode: v.optional(v.string()),
        country: v.string(),
      })
    ),
    // Contact information
    contact: v.optional(
      v.object({
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
      })
    ),
    // Entity type (e.g., chapter, board, committee)
    entityType: v.optional(v.string()),
  })
    .index("by_parent", ["entityParentId"])
    .index("by_organization", ["organizationId"])
    .index("by_domain", ["domainURL"]),

  // Pages table for dynamic content
  pages: defineTable({
    title: v.string(),
    // Content stored as a JSON structure for rich text
    content: v.string(), // JSON stringified content
    // Author of the page
    authorId: v.id("users"),
    // Entity this page belongs to
    entityId: v.id("entities"),
    // Visibility: public or private
    isPublic: v.boolean(),
    // Page status: draft, published, archived
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    // Page type for templating
    pageType: v.optional(v.string()),
    // Tags for categorization
    tags: v.optional(v.array(v.string())),
    // Last modified timestamp (updated on edits)
    lastModified: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_entity", ["entityId"])
    .index("by_visibility", ["isPublic"])
    .index("by_status", ["status"])
    .index("by_entity_and_status", ["entityId", "status"]),

  // Page revisions for version history
  pageRevisions: defineTable({
    // Reference to the original page
    pageId: v.id("pages"),
    // Content at this revision
    content: v.string(), // JSON stringified content
    // User who made this revision
    authorId: v.id("users"),
    // Revision number
    revisionNumber: v.number(),
    // Optional revision comment
    comment: v.optional(v.string()),
  })
    .index("by_page", ["pageId"])
    .index("by_page_and_revision", ["pageId", "revisionNumber"]),

  // Permissions table for fine-grained access control
  permissions: defineTable({
    // User this permission applies to
    userId: v.id("users"),
    // Entity this permission applies to
    entityId: v.id("entities"),
    // Role: admin, leadership, brother, public
    role: v.string(),
    // User who granted this permission
    grantedBy: v.id("users"),
    // When the permission was granted
    grantedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_entity", ["entityId"])
    .index("by_user_and_entity", ["userId", "entityId"]),
    
  // Permission audit trail
  permissionAudits: defineTable({
    permissionId: v.id("permissions"),
    userId: v.string(), // User whose permissions changed
    entityId: v.string(),
    oldRole: v.optional(v.string()),
    newRole: v.string(),
    changedBy: v.string(), // User who made the change
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_entity", ["entityId"])
    .index("by_timestamp", ["timestamp"]),
});
