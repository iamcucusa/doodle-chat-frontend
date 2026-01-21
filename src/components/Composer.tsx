/**
 * Composer Component
 * Owns input state and handles form submission.
 *
 */

import { useState, useRef, useEffect } from 'react';
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
 * API validation limit to provide client-side feedback.
 */
const MAX_MESSAGE_LENGTH = 500;

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

  const [wasTruncated, setWasTruncated] = useState(false);

  const pasteExceededLimitRef = useRef(false);

  const messageInputRef = useRef<HTMLInputElement>(null);

  const messageLength = messageText.length;

  const isMessageTooLong = messageLength > MAX_MESSAGE_LENGTH;

  const trimmedLength = messageText.trim().length;

  /**
   * Determines if the form is valid and can be submitted.
   * Invalid when:
   * - Message is empty/whitespace
   * - Message exceeds max length
   * - Currently sending
   */
  const isValid =
    trimmedLength > 0 && !isMessageTooLong && sendStatus !== 'loading';

  const isInputInvalid = trimmedLength === 0 || isMessageTooLong;

  const clearPasteTracking = () => {
    pasteExceededLimitRef.current = false;
  };

  /**
   * Note: This fires BEFORE the paste is applied, so we use a ref to track
   * that truncation occurred, then set state in onChange after the paste is processed.
   */
  const handlePaste = (pasteEvent: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = pasteEvent.clipboardData.getData('text');
    if (pastedText.length > MAX_MESSAGE_LENGTH) {
      pasteExceededLimitRef.current = true;
    }
  };

  const handleInputChange = (
    changeEvent: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = changeEvent.target.value;

    if (newValue.length > MAX_MESSAGE_LENGTH) {
      const truncated = newValue.slice(0, MAX_MESSAGE_LENGTH);
      setMessageText(truncated);
      setWasTruncated(true);
      clearPasteTracking();
      return;
    }

    if (
      pasteExceededLimitRef.current &&
      newValue.length === MAX_MESSAGE_LENGTH
    ) {
      setWasTruncated(true);
      clearPasteTracking();
    }

    if (wasTruncated && newValue.length < MAX_MESSAGE_LENGTH) {
      setWasTruncated(false);
      clearPasteTracking();
    }

    setMessageText(newValue);
  };

  /**
   * Auto-clear truncation message after 4 seconds
   */
  useEffect(() => {
    if (!wasTruncated) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setWasTruncated(false);
    }, 4000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [wasTruncated]);

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
      setWasTruncated(false);
      messageInputRef.current?.focus();
    } catch {
      /**
       * Error handling is done by parent via sendStatus/sendError
       */
    }
  };

  const showClientValidationError = isMessageTooLong;
  const showTruncationMessage =
    wasTruncated && messageLength === MAX_MESSAGE_LENGTH;
  const errorMessageId =
    showClientValidationError || showTruncationMessage
      ? 'composer-error'
      : undefined;

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
          onChange={handleInputChange}
          onPaste={handlePaste}
          disabled={sendStatus === 'loading'}
          aria-describedby={errorMessageId}
          aria-busy={sendStatus === 'loading'}
          aria-invalid={isInputInvalid}
          maxLength={MAX_MESSAGE_LENGTH}
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

      {(showClientValidationError || showTruncationMessage) && (
        <div id={errorMessageId} role="alert" className={styles.errorMessage}>
          {showClientValidationError
            ? `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters (${messageLength}/${MAX_MESSAGE_LENGTH})`
            : `Message was truncated to ${MAX_MESSAGE_LENGTH} characters. The first ${MAX_MESSAGE_LENGTH} characters will be sent.`}
        </div>
      )}
    </form>
  );
}
