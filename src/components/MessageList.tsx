import type { ChatMessage } from '@models/message';
import styles from './MessageList.module.css';
import { MessageItem } from '@components/MessageItem';
import { useEffect, useRef, useState } from 'react';

export interface MessageListProps {
  messages: ReadonlyArray<ChatMessage>;
  currentAuthor: string;
  isLoading?: boolean;
}

export function MessageList({
  messages,
  currentAuthor,
  isLoading = false,
}: MessageListProps) {
  const containerRef = useRef<HTMLElement>(null);
  const wasNearBottomRef = useRef<boolean>(true);

  const [
    hasNewMessagesWhileAwayFromBottom,
    setHasNewMessagesWhileAwayFromBottom,
  ] = useState(false);

  const previousMessagesRef = useRef<ReadonlyArray<ChatMessage>>([]);
  const isInitialLoadRef = useRef<boolean>(true);

  const firstMessageIndex = messages.length > 0 ? 0 : -1;
  const lastMessageIndex = messages.length > 0 ? messages.length - 1 : -1;

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  /**
   * Schedule state updates outside the synchronous effect body.
   */
  const scheduleSetHasNewMessagesWhileAwayFromBottom = (nextValue: boolean) => {
    queueMicrotask(() => {
      setHasNewMessagesWhileAwayFromBottom(nextValue);
    });
  };

  const handleNewMessagesClick = () => {
    scrollToBottom();
    scheduleSetHasNewMessagesWhileAwayFromBottom(false);
  };

  /**
   * Auto-scroll effect: runs when messages change.
   * - If a new message is from current user: (show their own message)
   * - If a new message is from other user: Only show indicator if user is away from bottom
   * - Skip indicator logic on initial load (when messages first populate)
   *
   */
  useEffect(() => {
    const previousMessages = previousMessagesRef.current;

    if (isInitialLoadRef.current) {
      if (!isLoading && messages.length > 0) {
        isInitialLoadRef.current = false;
        previousMessagesRef.current = messages;
        scrollToBottom();
      }
      return;
    }

    const previousMessageIds = new Set(previousMessages.map(msg => msg._id));
    const newMessages = messages.filter(
      msg => !previousMessageIds.has(msg._id)
    );

    if (newMessages.length === 0) {
      previousMessagesRef.current = messages;
      return;
    }

    const hasNewMessageFromCurrentUser = newMessages.some(
      msg => msg.author === currentAuthor
    );

    const hasNewMessageFromOthers = newMessages.some(
      msg => msg.author !== currentAuthor
    );

    if (hasNewMessageFromCurrentUser) {
      scrollToBottom();
      scheduleSetHasNewMessagesWhileAwayFromBottom(false);
    } else if (hasNewMessageFromOthers) {
      if (wasNearBottomRef.current) {
        scrollToBottom();
        scheduleSetHasNewMessagesWhileAwayFromBottom(false);
      } else {
        scheduleSetHasNewMessagesWhileAwayFromBottom(true);
      }
    }

    previousMessagesRef.current = messages;
  }, [messages, currentAuthor, isLoading]);

  const isOutgoing = (message: ChatMessage): boolean => {
    return message.author === currentAuthor;
  };

  return (
    <section aria-label="Messages" className={styles.root} ref={containerRef}>
      {isLoading && (
        <div className={styles.loading} role="status" aria-live="polite">
          Loading messages...
        </div>
      )}

      {!isLoading && messages.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyContent}>
            <p className={styles.emptyTitle}>No messages yet</p>
            <p className={styles.emptyMessage}>
              Start the conversation by sending a message.
            </p>
          </div>
        </div>
      )}

      {!isLoading && messages.length > 0 && (
        <>
          <ul className={styles.list}>
            {messages.map((message, index) => {
              const outgoing = isOutgoing(message);
              const isFirstMessage = index === firstMessageIndex;
              const isLastMessage = index === lastMessageIndex;

              return (
                <MessageItem
                  key={message._id}
                  message={message}
                  isOutgoing={outgoing}
                  isFirstMessage={isFirstMessage}
                  isLastMessage={isLastMessage}
                />
              );
            })}
          </ul>
          {hasNewMessagesWhileAwayFromBottom && (
            <button
              type="button"
              className={styles.newMessagesIndicator}
              onClick={handleNewMessagesClick}
              aria-label="Scroll to new messages"
            >
              New messages
            </button>
          )}
        </>
      )}
    </section>
  );
}
