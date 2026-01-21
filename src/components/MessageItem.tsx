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

  return (
    <li className={rootClassName}>
      <div className={styles.senderName}>{decodedAuthor}</div>
      <p className={styles.messageText}>{decodedMessage}</p>
      <time
        dateTime={message.createdAt}
        className={styles.timestamp}
        title={new Date(message.createdAtMs).toLocaleString()}
      >
        {new Date(message.createdAtMs).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        })}
      </time>
    </li>
  );
}
