/**
 * Decodes HTML entities in a string.
 *
 * Examples:
 * - `&#39;` → `'`
 * - `&quot;` → `"`
 * - `&amp;` → `&`
 * - `&lt;` → `<`
 * - `&gt;` → `>`
 *
 * @param text - Text containing HTML entities
 * @returns Decoded text with HTML entities converted to their characters
 *
 * @example
 * ```typescript
 * decodeHtmlEntities("It&#39;s super easy") // Returns: "It's super easy"
 * decodeHtmlEntities("&quot;Hello&quot;") // Returns: '"Hello"'
 * ```
 */
export function decodeHtmlEntities(text: string): string {
  if (typeof document === 'undefined') {
    return text;
  }

  const textarea = document.createElement('textarea');

  textarea.innerHTML = text;
  return textarea.textContent || textarea.innerText || text;
}
