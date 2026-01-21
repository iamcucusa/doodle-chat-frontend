/**
 * API Client Module
 *
 * This module provides a type-safe, promise-based HTTP client for interacting
 * with the REST API. It's designed to be framework-agnostic and is intended to be
 * consumed by custom React hooks.
 *
 */

import { apiConfig } from '@config/env';
import { ApiError, createApiErrorFromResponse, isApiError } from './api-error';
import type {
  CreateMessageRequest,
  GetMessagesParams,
  Message,
} from '@models/message';

/**
 * HTTP methods supported by the API client.
 *
 */
const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
} as const;

/**
 * Type for HTTP method values.
 */
type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

/**
 * Request options for the internal request method.
 */
interface RequestOptions {
  readonly method: HttpMethod;
  readonly path: string;
  readonly body?: Readonly<Record<string, unknown>>;
  readonly queryParams?: Readonly<Record<string, string | number | undefined>>;
}

/**
 * API Client Class
 *
 * This class provides methods for interacting with the REST API.
 * All methods return promises that resolve to typed data or reject with ApiError.
 *
 * Class Structure:
 * - Private methods: Internal implementation details (request, buildUrl, etc.)
 * - Public methods: API endpoints (getMessages, createMessage)
 * - Configuration: Uses apiConfig from env.ts
 *
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly token: string;

  /**
   * Creates a new API client instance.
   *
   * @param baseUrl - Base URL for API requests (defaults to apiConfig.baseUrl)
   * @param token - Authentication token (defaults to apiConfig.token)
   *
   */
  constructor(
    baseUrl: string = apiConfig.baseUrl,
    token: string = apiConfig.token
  ) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  /**
   * Builds a complete URL from base URL, path, and query parameters.
   *
   * URLSearchParams Usage:
   * - Automatically URL-encodes values (spaces → %20, special chars → encoded)
   * - Handles multiple values for the same key (if needed)
   * - Formats query string correctly (?key=value&key2=value2)
   * - Prevents XSS attacks through proper encoding
   *
   * Examples:
   * - path: '/messages', params: { limit: 10 }
   *   → 'http://localhost:3000/api/v1/messages?limit=10'
   *
   * - path: '/messages', params: { limit: 10, after: '2024-01-01T00:00:00Z' }
   *   → 'http://localhost:3000/api/v1/messages?limit=10&after=2024-01-01T00:00:00Z'
   *
   * - path: '/messages', params: { limit: undefined, after: '2024-01-01' }
   *   → 'http://localhost:3000/api/v1/messages?after=2024-01-01'
   *   (undefined values are filtered out)
   *
   * @param path - API endpoint path (e.g., '/messages')
   * @param queryParams - Optional query parameters object
   * @returns Complete URL with properly encoded query string
   *
   */
  private buildUrl(
    path: string,
    queryParams?: Readonly<Record<string, string | number | undefined>>
  ): string {
    /**
     * Parse baseUrl to get origin and pathname
     */
    const baseUrlObj = new URL(this.baseUrl);

    /**
     * Normalize path: remove the leading slash if present
     */
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

    /**
     * Append the path to baseUrl's pathname
     * Ensure there's exactly one / between baseUrl pathname and the new path
     */
    const basePathname = baseUrlObj.pathname.endsWith('/')
      ? baseUrlObj.pathname.slice(0, -1)
      : baseUrlObj.pathname;
    const combinedPathname = `${basePathname}/${normalizedPath}`;

    /**
     * Construct URL using origin and the combined pathname
     */
    const url = new URL(combinedPathname, baseUrlObj.origin);

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   *
   * Centralizes header construction logic ensuring all requests include
   * required headers (Authorization, Content-Type).
   *
   * Header Construction:
   * 1. Always includes an Authorization header with the Bearer token
   * 2. Conditionally adds Content-Type for requests with body
   * 3. Returns HeadersInit compatible with fetch API
   *
   * @param hasBody - Whether the request includes a body (true for POST, false for GET)
   * @returns Headers object compatible with fetch API HeadersInit
   *
   * Examples:
   *
   * GET request (nobody):
   * ```TypeScript
   * buildHeaders(false)
   * // Returns: { Authorization: 'Bearer token' }
   * ```
   *
   * POST request (with body):
   * ```TypeScript
   * buildHeaders(true)
   * // Returns: {
   * // Authorization: 'Bearer token',
   * // 'Content-Type': 'application/json'
   * // }
   * ```
   */
  private buildHeaders(hasBody: boolean): HeadersInit {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
    };

    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  /**
   * Core request method that handles all HTTP requests.
   *
   * This is the heart of the API client. All public methods
   * will call this method to make actual HTTP requests.
   *
   * Why private?
   * - Encapsulation: External code should use specific methods (getMessages, etc.)
   * - Prevents misuse: Can't make arbitrary requests
   * - Type safety: Public methods provide better types than generic request<T>
   *
   * Request Flow:
   * 1. Build URL with query parameters
   * 2. Build headers (Authorization, Content-Type)
   * 3. Serialize body to JSON (if present)
   * 4. Make a fetch request
   * 5. Check response status
   * 6. Parse JSON response
   * 7. Handle errors appropriately
   *
   * @param options - Request configuration (method, path, body, query params)
   * @returns Promise that resolves to typed response data
   * @throws ApiError if request fails (network, HTTP error, or JSON parsing error)
   *
   * Error Handling Strategy:
   * - Network errors (no response): Status 0, wrapped in ApiError
   * - HTTP errors (4xx, 5xx): Converted to ApiError via createApiErrorFromResponse
   * - JSON parsing errors: Wrapped in ApiError with status 0
   * - Already ApiError: Re-thrown as-is
   */
  private async request<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.queryParams);

    const headers = this.buildHeaders(options.body !== undefined);

    const fetchOptions: RequestInit = {
      method: options.method,
      headers,
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw await createApiErrorFromResponse(response, url);
      }

      const contentType = response.headers.get('content-type');
      const hasJsonContent = contentType?.includes('application/json');

      if (response.status === 204 || !hasJsonContent) {
        /**
         * For 204 No Content, return undefined as T.
         * TypeScript will handle the type based on usage.
         */
        return undefined as T;
      }

      /**
       * Parse JSON response body.
       *
       * response.json() can throw if:
       * - Response is not valid JSON
       * - Response is empty, but the content-type says JSON
       * - Network error during streaming
       *
       * These errors are caught in the outer catch block.
       */
      const text = await response.text();

      if (!text.trim()) {
        return undefined as T;
      }

      return JSON.parse(text) as T;
    } catch (error) {
      /**
       * Error handling: Categorize and handle different error types.
       *
       * Error types we handle:
       * 1. ApiError (from createApiErrorFromResponse): Re-throw as-is
       * 2. Network errors (fetch rejects): Wrap in ApiError with status 0
       * 3. JSON parsing errors: Wrap in ApiError with status 0
       * 4. Unknown errors: Wrap in ApiError with a generic message
       */
      if (isApiError(error)) {
        throw error;
      }

      /**
       * Handle network errors (no response received).
       * When:
       * - Network is offline
       * - Server is unreachable (DNS failure, connection refused)
       * - Request timeout (if configured)
       * - CORS errors (browser blocks cross-origin request)
       * - SSL/TLS errors
       *
       * Status 0 indicates a network error (not an HTTP status code).
       * This helps distinguish network errors from HTTP errors.
       */
      const errorMessage =
        error instanceof Error ? error.message : 'Network error occurred';

      throw new ApiError(
        errorMessage,
        /**
         * Status 0 indicates a network error (not HTTP status)
         */
        0,
        undefined,
        url
      );
    }
  }

  /**
   * Get messages from the API.
   *
   * This is a public method that external code will call.
   * It provides a type-safe interface for fetching messages with optional
   * query parameters for pagination and filtering.
   *
   * Query Parameters:
   * - `limit`: Maximum number of messages to return (e.g., 10, 20, 50)
   * - `after`: ISO timestamp - return messages created after this time
   * - `before`: ISO timestamp - return messages created before this time

   * TypeScript Return Type:
   * - `Promise<ReadonlyArray<Message>>` ensures type safety
   *
   * @param params - Optional query parameters for filtering and pagination
   * @returns Promise that resolves to a readonly array of messages
   * @throws ApiError if request fails (network error, 4xx, 5xx, etc.)
   *
   * Examples:
   *
   * Basic usage (no parameters):
   * ```TypeScript
   * const messages = await apiClient.getMessages();
   * // Returns: Promise<ReadonlyArray<Message>>
   * ```
   *
   * With limit:
   * ```TypeScript
   * const messages = await apiClient.getMessages({ limit: 10 });
   * // GET /api/v1/messages?limit=10
   * ```
   *
   * Pagination (get messages after a timestamp):
   * ```TypeScript
   * const messages = await apiClient.getMessages({
   *   limit: 20,
   *   after: '2024-01-01T00:00:00Z',
   * });
   * // GET /api/v1/messages?limit=20&after=2024-01-01T00:00:00Z
   * ```
   *
   * Error Handling:
   * ```TypeScript
   * try {
   *   const messages = await apiClient.getMessages({ limit: 10 });
   *   // Handle success
   * } catch (error) {
   *   if (isApiError(error)) {
   *     if (error.isUnauthorized()) {
   *       // Handle 401: Redirect to log in
   *     } else if (error.isNotFound()) {
   *       // Handle 404: Show "no messages" message
   *     } else {
   *       // Handle other errors
   *     }
   *   }
   * }
   * ```
   */
  async getMessages(
    params?: Readonly<GetMessagesParams>
  ): Promise<ReadonlyArray<Message>> {
    return this.request<ReadonlyArray<Message>>({
      method: HttpMethod.GET,
      path: '/messages',
      queryParams: params,
    });
  }

  /**
   * Create a new message via the API.
   *
   * This is a public method that external code will call.
   * It provides a type-safe interface for creating messages with proper
   * request body serialization and Content-Type handling.
   *
   * Request Body Structure:
   * ```TypeScript
   * {
   *   message: string, // The message content
   *   author: string // The author's name
   * }
   * ```
   *
   * Response Structure:
   * ```TypeScript
   * {
   *   _id: string, // Server-generated ID
   *   message: string, // Echoed message content
   *   author: string, // Echoed author name
   *   createdAt: string // ISO 8601 timestamp
   * }
   * ```
   *
   * @param data - Message data containing message and author fields
   * @returns Promise that resolves to a created message
   * @throws ApiError if request fails (validation, network, server errors)
   *
   * Usage Examples:
   *
   * Basic usage:
   * ```TypeScript
   * const newMessage = await apiClient.createMessage({
   *   message: 'Hello, world!',
   *   author: 'John Doe',
   * });
   * // Returns: Promise<Message>
   * // POST /api/v1/messages
   * // Body: { "message": "Hello, world!", "author": "John Doe" }
   * ```
   *
   * With a custom hook:
   * ```TypeScript
   * import { useChatMessages } from '@hooks/useChatMessages';
   *
   * const { sendMessage, sendStatus, sendError } = useChatMessages();
   *
   * // Send a message
   * await sendMessage({
   *   message: 'Hello!',
   *   author: 'Jane',
   * });
   *
   * // Check status
   * if (sendStatus === 'success') {
   *   console.log('Message sent successfully');
   * } else if (sendStatus === 'error') {
   *   console.error('Failed to send:', sendError?.message);
   * }
   * ```
   *
   * With form handling:
   * ```TypeScript
   * const handleSubmit = async (formData: FormData) => {
   *   try {
   *     const message = await apiClient.createMessage({
   *       message: formData.get('message') as string,
   *       author: formData.get('author') as string,
   *     });
   *     // Handle success
   *   } catch (error) {
   *     // Handle error
   *   }
   * };
   * ```
   *
   */
  async createMessage(data: Readonly<CreateMessageRequest>): Promise<Message> {
    return this.request<Message>({
      method: HttpMethod.POST,
      path: '/messages',
      body: data,
    });
  }
}

/**
 * Singleton instance of the API client.
 * Can still create new instances for testing if needed
 *
 */
export const apiClient = new ApiClient();

export default apiClient;
