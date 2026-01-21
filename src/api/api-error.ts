import type { ApiErrorResponse } from '@models/api';

/**
 * Custom error class for API-related errors
 *
 * This class extends the native Error class to preserve API error details
 * while maintaining compatibility with standard error handling patterns.
 *
 */
export class ApiError extends Error {
  readonly statusCode: number;

  /**
   * Original error response from the API
   * - Some errors (network errors, timeouts) don't have API responses
   * - Allows ApiError to be used for non-API errors too
   */
  readonly response?: Readonly<ApiErrorResponse>;

  /**
   * The API endpoint that caused the error
   *
   * Useful for debugging and logging:
   * Some errors occur before making the request (e.g., invalid URL)
   */
  readonly endpoint?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    response?: Readonly<ApiErrorResponse>,
    endpoint?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
    this.endpoint = endpoint;

    /**
     * Maintains proper stack trace for where our error was thrown (only available on V8).
     */
    if (
      'captureStackTrace' in Error &&
      typeof Error.captureStackTrace === 'function'
    ) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  isServerError(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600;
  }

  isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  isNotFound(): boolean {
    return this.statusCode === 404;
  }

  /**
   * Get validation errors if this is a validation error (400)
   *
   * Validation errors contain field-level details:
   * - Which fields failed validation
   * - Specific error messages per field
   * - Useful for showing inline form errors
   * @returns Array of field validation errors, or undefined
   */
  getValidationErrors():
    | ReadonlyArray<{ readonly field: string; readonly message: string }>
    | undefined {
    if (this.statusCode !== 400 || !this.response) {
      return undefined;
    }

    /**
     * Check if response.message is an array (validation errors).
     */
    if (Array.isArray(this.response.message)) {
      return this.response.message;
    }

    return undefined;
  }

  /**
   * Convert error to a plain object for logging/serialization
   *
   * Useful for:
   * - Logging to external services
   * - Serializing errors for API responses
   * - Debugging in production
   *
   * @returns Plain object representation of the error
   */
  toJSON(): {
    readonly name: string;
    readonly message: string;
    readonly statusCode: number;
    readonly endpoint?: string;
    readonly response?: Readonly<ApiErrorResponse>;
  } {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      endpoint: this.endpoint,
      response: this.response,
    };
  }

  /**
   * Override toString() for better string representation
   */
  override toString(): string {
    const parts = [
      `${this.name}: ${this.message}`,
      `Status: ${this.statusCode}`,
    ];

    if (this.endpoint) {
      parts.push(`Endpoint: ${this.endpoint}`);
    }

    return parts.join(' | ');
  }
}

/**
 * Type guard function to check if an error is an ApiError
 * @param error - Unknown error to check
 * @returns True if error is an ApiError instance
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Helper function to create an ApiError from a fetch Response
 *
 * This is a factory function that:
 * - Extracts error details from a fetch Response object
 * - Parses JSON error response
 * - Creates a properly formatted ApiError
 *
 * @param response - Fetch Response object
 * @param endpoint - Optional endpoint that failed
 * @returns Promise that resolves to an ApiError
 */
export async function createApiErrorFromResponse(
  response: Response,
  endpoint?: string
): Promise<ApiError> {
  let errorData: ApiErrorResponse | undefined;

  try {
    /**
     * Try to parse JSON error response.
     * API might return structured error data.
     */
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      errorData = (await response.json()) as ApiErrorResponse;
    }
  } catch {
    /**
     * If JSON parsing fails, use response text as message.
     * Some APIs return plain text errors.
     */
    try {
      const text = await response.text();
      errorData = {
        message: text || response.statusText || 'Unknown error',
        statusCode: response.status,
      };
    } catch {
      /**
       * If even text parsing fails, use status text.
       */
      errorData = {
        message: response.statusText || 'Unknown error',
        statusCode: response.status,
      };
    }
  }

  /**
   * Extract error message.
   * Handle both string and array message formats.
   */
  const message: string = Array.isArray(errorData?.message)
    ? errorData.message.map(errorItem => errorItem.message).join(', ')
    : typeof errorData?.message === 'string'
      ? errorData.message
      : (response.statusText ?? 'Unknown error');

  return new ApiError(message, response.status, errorData, endpoint);
}
