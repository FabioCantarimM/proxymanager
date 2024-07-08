/**
 * Utility functions for working with numbers.
 *
 * @namespace Numbers
 */
export namespace Numbers {
  /**
   * Get the size of a payload in kilobytes.
   *
   * @param {unknown} payload - The object to get the size.
   * @returns {number} The size of the payload with precision set to 2.
   */
  export const getBytesLength = (payload: unknown): number =>
    Number((Buffer.byteLength(typeof payload === 'string' ? payload : JSON.stringify(payload)) / 1000).toFixed(2))

  /**
   * Generates a random number with the specified number of digits.
   * @param digits The number of digits the random number should have.
   * @returns A random number with the specified number of digits.
   */
  export function generateRandomNumber(digits: number): number {
    const min = Math.pow(10, digits - 1) // Minimum value with specified number of digits
    const max = Math.pow(10, digits) - 1 // Maximum value with specified number of digits
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Return an exponential backoff with jitter
   * @param count
   * @returns
   */
  export const backoff = (count: number) => 30 ** count * 1000 + Math.random() * 1000
}
