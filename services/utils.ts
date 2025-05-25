/**
 * Utility functions shared across services
 */

/**
 * Helper function to format tags consistently for display
 * Converts underscores to spaces and capitalizes properly
 */
export function formatTag(tag: string): string {
  return tag
    .replace(/_/g, " ") // Convert underscores to spaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
