/**
 * Container component for the chat interface (Iteration 1 MVP).
 * Integrates data layer (useChatMessages hook) with UI shell.
 *
 * Responsibilities:
 * - Renders main chat layout shell
 * - Handles loading, error, and empty states
 * - Establishes accessibility landmarks and live regions
 *
 */
import { useChatMessages } from '@hooks/useChatMessages';
import styles from './ChatScreen.module.css';
import { MessageList } from '@components/MessageList';

/**
 * Messages with author === 'You' are treated as outgoing.
 * This is a simplification that:
 * - Matches the mockup's two-sided layout
 * - Avoids introducing authentication/identity logic
 * - Is easy to replace with real user ID when requirements expand
 */
const CURRENT_USER = 'You';

/**
 * ChatScreen Component
 * @returns The main chat interface shell
 */
export function ChatScreen() {
  const { messages, loadStatus, loadError, reload } = useChatMessages();

  return (
    <>
      {/* Skip to content link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <main id="main-content" className={styles.root}>
        {/* Header with page title */}
        <h1>Chat</h1>
        {/* Loading status live region */}
        {loadStatus === 'loading' && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            Loading messages...
          </div>
        )}

        {/* Messages container*/}
        <div className={styles.messagesContainer}>
          {(loadStatus === 'error' ||
            (loadStatus === 'loading' && loadError)) &&
            loadError && (
              <div
                className={styles.errorContainer}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
              >
                <div className={styles.errorContent}>
                  <p className={styles.errorTitle}>Unable to load messages</p>
                  <p className={styles.errorMessage}>
                    {loadError.statusCode === 0
                      ? 'Unable to connect to the server. Please check your connection and try again.'
                      : loadError.message}
                  </p>
                  <button
                    className={styles.retryButton}
                    onClick={() => void reload()}
                    disabled={loadStatus === 'loading'}
                    aria-busy={loadStatus === 'loading'}
                  >
                    {loadStatus === 'loading' ? 'Retrying...' : 'Retry'}
                  </button>
                </div>
              </div>
            )}

          {loadStatus !== 'error' && (
            <MessageList
              messages={messages}
              currentAuthor={CURRENT_USER}
              isLoading={loadStatus === 'loading'}
            />
          )}
        </div>
      </main>
    </>
  );
}
