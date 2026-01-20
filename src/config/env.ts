/**
 * Environment Configuration
 *
 * This module centralizes all environment-based configuration for the application.
 * It provides type-safe access to environment variables with sensible defaults
 * for local development.
 *
 */

/**
 * API-related configuration values.
 *
 */
export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
  token: import.meta.env.VITE_API_TOKEN ?? 'super-secret-doodle-token',
} as const;

/**
 * Type-safe access to API configuration
 *
 */
export type ApiConfig = typeof apiConfig;

/**
 * Validation function to ensure required configuration is present
 *
 */
export function validateApiConfig(): void {
  if (!apiConfig.baseUrl) {
    throw new Error('VITE_API_BASE_URL is required but not set');
  }

  if (!apiConfig.token) {
    throw new Error('VITE_API_TOKEN is required but not set');
  }

  try {
    new URL(apiConfig.baseUrl);
  } catch {
    throw new Error(`Invalid API base URL: ${apiConfig.baseUrl}`);
  }
}

/**
 * Initialize and validate configuration
 * Will be consumed in:
 * - main.tsx (before rendering the app)
 *
 */
export function initializeConfig(): void {
  validateApiConfig();
}
