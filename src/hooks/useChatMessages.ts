/**
 * Custom hook for managing chat messages with explicit state management.
 *
 * Public Contract:
 * - messages: Message[] - Array of messages in chronological order (oldest first)
 *   Messages are stored in display order: oldest at index 0, newest at index n.
 *   This matches typical chat UX where the oldest messages appear at top, newest at bottom.
 * - loadStatus: 'idle' | 'loading' | 'success' | 'error'
 * - loadError: ApiError | null
 * - reload(): Promise<void> - Manually reload messages
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@api/api-client';
import { ApiError, isApiError } from '@api/api-error';
import type { Message, ChatMessage } from '@models/message';
import type { AsyncStatus, UseChatMessagesReturn } from '@models/hooks';

/**
 * Default number of messages to fetch at a higher cap to ensure recent messages are
 * included without implementing pagination yet.
 */
const DEFAULT_MESSAGES_LIMIT = 200;

/**
 * Normalizes an API message by parsing createdAt once into createdAtMs.
 * This avoids repeated Date parsing during sorting and comparisons.
 */
function normalizeMessage(message: Message): ChatMessage {
  return {
    ...message,
    createdAtMs: new Date(message.createdAt).getTime(),
  };
}

/**
 * Merges messages by id, deduplicating and sorting chronologically.
 * Incoming messages overwrite existing ones with the same id.
 */
function mergeMessagesById(
  existing: ReadonlyArray<ChatMessage>,
  incoming: ReadonlyArray<ChatMessage>
): ReadonlyArray<ChatMessage> {
  const messageMap = new Map<string, ChatMessage>();

  for (const message of existing) {
    messageMap.set(message._id, message);
  }

  for (const message of incoming) {
    messageMap.set(message._id, message);
  }

  return Array.from(messageMap.values()).sort(
    (firstMessage, secondMessage) =>
      firstMessage.createdAtMs - secondMessage.createdAtMs
  );
}

/**
 * Custom hook to manage chat messages.
 *
 * Behavior:
 * - Loads messages once on mount
 * - Orders messages chronologically (oldest first) matching display order
 * - Does not poll by default
 *
 * @returns Hook state and methods
 */
export function useChatMessages(): UseChatMessagesReturn {
  const [messages, setMessages] = useState<ReadonlyArray<ChatMessage>>([]);
  const [loadStatus, setLoadStatus] = useState<AsyncStatus>('loading');
  const [loadError, setLoadError] = useState<ApiError | null>(null);

  /**
   * Fetches and normalizes messages from the API.
   * Note: Ordering normalization happens in the hook layer (not API client)
   * because:
   * 1. API client stays framework-agnostic and simple (transport layer only)
   * 2. In production, APIs typically return the correct order via query params (?order=asc)
   * 3. This is defensive programming—handles current API behavior while keeping the API client reusable
   * 4. If API changes to return the correct order, we simplify the hook without touching the API client
   *
   * @returns Promise that resolves to a normalized messages array, or rejects with ApiError
   */
  const fetchAndNormalizeMessages = useCallback(async (): Promise<
    ReadonlyArray<ChatMessage>
  > => {
    const fetchedMessages = await apiClient.getMessages({
      limit: DEFAULT_MESSAGES_LIMIT,
    });
    const normalized = fetchedMessages.map(normalizeMessage);
    return mergeMessagesById([], normalized);
  }, []);

  /**
   * Load messages from the API and update state.
   *
   * This function handles state updates for loading messages. It's used
   * by both the initial load effect and the manual reload function.
   */
  const loadMessages = useCallback(async () => {
    setLoadStatus('loading');
    setLoadError(null);

    try {
      const sorted = await fetchAndNormalizeMessages();
      setMessages(sorted);
      setLoadStatus('success');
    } catch (error) {
      const apiError = isApiError(error)
        ? error
        : new ApiError(
            error instanceof Error ? error.message : 'Failed to load messages',
            0
          );

      setLoadError(apiError);
      setLoadStatus('error');
    }
  }, [fetchAndNormalizeMessages]);

  /**
   * Reload messages manually.
   */
  const reload = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    let ignore = false;

    void fetchAndNormalizeMessages()
      .then(sorted => {
        if (!ignore) {
          setMessages(sorted);
          setLoadStatus('success');
          setLoadError(null);
        }
      })
      .catch(error => {
        if (!ignore) {
          const apiError = isApiError(error)
            ? error
            : new ApiError(
                error instanceof Error
                  ? error.message
                  : 'Failed to load messages',
                0
              );

          setLoadError(apiError);
          setLoadStatus('error');
        }
      });

    return () => {
      ignore = true;
    };
  }, [fetchAndNormalizeMessages]);

  return {
    messages,
    loadStatus,
    loadError,
    reload,
  };
}
