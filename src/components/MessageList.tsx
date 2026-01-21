import type { ChatMessage } from '@models/message';
import styles from './MessageList.module.css';
import { MessageItem } from '@components/MessageItem';

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
  const isOutgoing = (message: ChatMessage): boolean => {
    return message.author === currentAuthor;
  };

  const firstMessageIndex = messages.length > 0 ? 0 : -1;
  const lastMessageIndex = messages.length > 0 ? messages.length - 1 : -1;

  return (
    <section aria-label="Messages" className={styles.root}>
      {isLoading && (
        <div className={styles.loading} role="status" aria-live="polite">
          Loading messages...
        </div>
      )}

      {!isLoading && messages.length === 0 && (
        <div className={styles.empty}>No messages yet.</div>
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
        </>
      )}
    </section>
  );
}
