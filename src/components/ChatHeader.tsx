import type { ChatMessage } from '@models/message';
import styles from './ChatHeader.module.css';

export interface ChatHeaderProps {
  messages: ReadonlyArray<ChatMessage>;
  currentAuthor: string;
}

/**
 *
 * Returns participants sorted alphabetically, with the currentAuthor appended at the end.
 *
 * @param messages - Array of messages
 * @param currentAuthor - Current user's author name
 * @returns Array of unique participant names
 */
function extractParticipants(
  messages: ReadonlyArray<ChatMessage>,
  currentAuthor: string
): ReadonlyArray<string> {
  const uniqueAuthors = new Set<string>();
  for (const message of messages) {
    if (message.author && message.author.trim()) {
      uniqueAuthors.add(message.author.trim());
    }
  }

  const otherParticipants = Array.from(uniqueAuthors)
    .filter(author => author !== currentAuthor)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  return currentAuthor
    ? [...otherParticipants, currentAuthor]
    : otherParticipants;
}

function getInitial(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : '?';
}

export function ChatHeader({ messages, currentAuthor }: ChatHeaderProps) {
  const participants = extractParticipants(messages, currentAuthor);
  const groupInitial = getInitial('Doodle Team');
  const groupName = 'Doodle Team';
  const participantCount = participants.length;

  return (
    <header className={styles.root} aria-label="Chat header">
      <div className={styles.avatar} aria-hidden="true">
        <span className={styles.avatarInitial}>{groupInitial}</span>
      </div>

      <div className={styles.info}>
        <h1 className={styles.groupName}>
          <span aria-label="lady and computer emoji" role="img">
            👩‍💻
          </span>{' '}
          <span>{groupName}</span>
        </h1>
        {participantCount > 0 && (
          <div className={styles.participants}>
            <span className="sr-only">
              Group participants ({participantCount}):{' '}
            </span>
            {participants.map((participant, index) => (
              <span key={participant} className={styles.participant}>
                {index > 0 && <span className="sr-only">, </span>}
                <span>{participant}</span>
                {index < participants.length - 1 && (
                  <span aria-hidden="true">, </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
