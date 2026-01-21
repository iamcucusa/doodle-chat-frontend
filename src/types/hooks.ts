import type { ApiError } from '@api/api-error.ts';
import type { ChatMessage, CreateMessageRequest } from '@models/message.ts';

/**
 * Async operation status.
 * Represents the state of an asynchronous operation (load, send, etc.).
 *
 * States:
 * - 'idle': Initial state, operation not started
 * - 'loading': Operation in progress
 * - 'success': Operation completed successfully
 * - 'error': Operation failed
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Public contract of the hook.
 *
 * @example
 * ```TypeScript
 * import { useChatMessages } from '@hooks/useChatMessages';
 * import type { UseChatMessagesReturn } from '@models/hooks';
 *
 * function MyComponent() {
 *   const chat: UseChatMessagesReturn = useChatMessages();
 *   // ...
 *
 * ```
 */
export interface UseChatMessagesReturn {
  /** Array of messages in chronological order (oldest first) */
  readonly messages: ReadonlyArray<ChatMessage>;

  /** Status of the load operation */
  readonly loadStatus: AsyncStatus;

  /** Error from load operation, or null if no error */
  readonly loadError: ApiError | null;

  /** Status of the send operation */
  readonly sendStatus: AsyncStatus;

  /** Error from send operation, or null if no error */
  readonly sendError: ApiError | null;

  /** Manually reload messages */
  readonly reload: () => Promise<void>;

  /** Send a new message */
  readonly sendMessage: (
    payload: Readonly<CreateMessageRequest>
  ) => Promise<void>;
}
