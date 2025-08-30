// packages/api/convex/client.ts
import { ConvexClient } from "convex/browser";

/**
 * Creates and returns a Convex client instance for testing purposes.
 * 
 * @returns A configured Convex client instance
 */
export function createClient() {
  // In a real implementation, this would use the CONVEX_URL from environment
  // For testing purposes, we'll create a client that can be mocked
  return new ConvexClient(process.env.CONVEX_URL || "https://example.convex.cloud");
}
