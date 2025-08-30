// packages/api/convex/clerk.ts
import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Configuration for Clerk authentication provider
 */
export const clerkConfig = {
  // Define the key for the JWT verification
  jwtVerificationKey: process.env.CLERK_JWT_VERIFICATION_KEY || "",
  // Define the issuer for the JWT
  issuer: process.env.CLERK_ISSUER || "https://clerk.unity-house.com",
};

/**
 * Clerk webhook handler for user creation/updates
 * This would be called by Clerk when user events occur
 */
export const handleClerkWebhook = action({
  args: {
    data: v.any(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would validate the webhook signature
    // and process the event data from Clerk
    
    const { data, type } = args;
    
    // Handle different event types
    switch (type) {
      case "user.created":
        // Process user creation event
        console.log("User created in Clerk:", data);
        break;
      case "user.updated":
        // Process user update event
        console.log("User updated in Clerk:", data);
        break;
      default:
        console.log("Unhandled Clerk event type:", type);
    }
    
    return { success: true };
  },
});

/**
 * Helper function to extract user information from Clerk auth
 */
export function extractUserInfoFromClerk(clerkUser: any) {
  return {
    clerkId: clerkUser.id,
    firstName: clerkUser.firstName || clerkUser.username || "New User",
    lastName: clerkUser.lastName || null,
    email: clerkUser.emailAddresses?.[0]?.emailAddress || null,
  };
}
