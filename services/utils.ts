/**
 * Utility functions shared across services
 */

/**
 * Helper function to format tags consistently
 */
export function formatTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
