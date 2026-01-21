/**
 * Composer Component
 * Owns input state and handles form submission.
 *
 */

import { useState, useRef } from 'react';
import type { ApiError } from '@api/api-error';
import type { CreateMessageRequest } from '@models/message';
import styles from './Composer.module.css';

export interface ComposerProps {
  currentAuthor: string;
  onSend: (payload: Readonly<CreateMessageRequest>) => Promise<void>;
  sendStatus: 'idle' | 'loading' | 'success' | 'error';
  sendError?: ApiError | null;
}

/**
 *
 * Renders a form with message input and send button.
 * Handles input state, validation, and submission.
 *
 * @param props - Component props
 * @returns The composer form component
 */
export function Composer({ currentAuthor, onSend, sendStatus }: ComposerProps) {
  const [messageText, setMessageText] = useState('');

  const messageInputRef = useRef<HTMLInputElement>(null);

  const trimmedLength = messageText.trim().length;

  const isValid = trimmedLength > 0 && sendStatus !== 'loading';

  const isInputInvalid = trimmedLength === 0;

  const handleSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (!isValid) {
      return;
    }

    try {
      await onSend({
        author: currentAuthor,
        message: messageText.trim(),
      });

      setMessageText('');
      messageInputRef.current?.focus();
    } catch {
      /**
       * Error handling is done by parent via sendStatus/sendError
       */
    }
  };

  return (
    <form className={styles.root} onSubmit={handleSubmit}>
      <div className={styles.inputGroup}>
        <label htmlFor="chatMessage" className="sr-only">
          Message
        </label>
        <input
          ref={messageInputRef}
          id="chatMessage"
          type="text"
          className={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChange={changeEvent => setMessageText(changeEvent.target.value)}
          disabled={sendStatus === 'loading'}
          aria-busy={sendStatus === 'loading'}
          aria-invalid={isInputInvalid}
          maxLength={undefined}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!isValid}
          aria-busy={sendStatus === 'loading'}
          aria-label={
            sendStatus === 'loading' ? 'Sending message' : 'Send message'
          }
        >
          Send
        </button>
      </div>
    </form>
  );
}
