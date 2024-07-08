/**
 * Utility functions for working with strings.
 *
 * @namespace Stryng
 */
export namespace Stryng {
  /**
   * Convert a string to PascalCase.
   *
   * @param {string} inputString - The input string to convert.
   * @returns {string} The string converted to PascalCase.
   */
  export function toPascalCase(inputString: string): string {
    const words = inputString
      .replace(/[^a-zA-Z0-9_]+/g, '')
      .toLowerCase()
      .split('_')

    const pascalCaseWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())

    return pascalCaseWords.join('')
  }

  /**
   * Create a slug from a string.
   *
   * @param {string} text - The input text to create a slug from.
   * @returns {string} The resulting slug.
   */
  export const slugify = (text: string): string =>
    text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '-')
      .replace(/--+/g, '-')
      .replace(/-/g, '_')
}
