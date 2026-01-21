export interface Message {
  readonly _id: string;
  readonly message: string;
  readonly author: string;
  /**
   * ISO 8601 timestamp
   */
  readonly createdAt: string;
}

/**
 * Extended Base Message type with metadata.
 */
export interface ChatMessage extends Message {
  /**
   * createdAtMs: Parsed timestamp in milliseconds
   * for efficient sorting without repeated Date parsing.
   */
  readonly createdAtMs: number;
}

export interface GetMessagesParams {
  readonly limit?: number;
  /**
   * ISO timestamp
   */
  readonly after?: string;
  /**
   * ISO timestamp
   */
  readonly before?: string;
}

export interface CreateMessageRequest {
  readonly message: string;
  readonly author: string;
}
