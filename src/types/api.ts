/**
 * API error response envelop shape returned by the backend.
 *
 * - `message` can be a string or a list of field-level validation errors.
 * - Used by the API error layer to provide structured error handling.
 */
export interface ApiErrorResponse {
  readonly message:
    | string
    | ReadonlyArray<{ readonly field: string; readonly message: string }>;
  readonly statusCode: number;
  readonly error?: string;
}
