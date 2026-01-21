import type { ChatMessage } from '@models/message';
import { decodeHtmlEntities } from '@utils/html-entities';
import styles from './MessageItem.module.css';

export interface MessageItemProps {
  message: ChatMessage;
  isOutgoing: boolean;
  isFirstMessage?: boolean;
  isLastMessage?: boolean;
}

/**
 * Formats a timestamp for display using Intl.DateTimeFormat.
 * Uses browser's locale for proper localization.
 *
 * @param timestampMs - Timestamp in milliseconds (from createdAtMs)
 * @returns Formatted time string (e.g., "2:30 PM" or "14:30" depending on locale)
 */
function formatTimestamp(timestampMs: number): string {
  const date = new Date(timestampMs);
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return formatter.format(date);
}

/**
 * MessageItem Component
 *
 * @param props - Component props
 * @returns The message item component
 */
export function MessageItem({
  message,
  isOutgoing,
  isFirstMessage = false,
  isLastMessage = false,
}: MessageItemProps) {
  const rootClassName = `${styles.root} ${
    isOutgoing ? styles.rootOutgoing : styles.rootIncoming
  } ${isFirstMessage ? styles.firstMessage : ''} ${
    isLastMessage ? styles.lastMessage : ''
  }`.trim();

  const decodedMessage = decodeHtmlEntities(message.message);
  const decodedAuthor = decodeHtmlEntities(message.author);

  const formattedTime = formatTimestamp(message.createdAtMs);

  return (
    <li className={rootClassName}>
      <div className={styles.senderName}>{decodedAuthor}</div>
      <p className={styles.messageText}>{decodedMessage}</p>
      <time
        dateTime={message.createdAt}
        className={styles.timestamp}
        title={new Date(message.createdAtMs).toLocaleString()}
      >
        {formattedTime}
      </time>
    </li>
  );
}
