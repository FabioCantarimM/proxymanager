/**
 * Utility functions for working with web URIs.
 *
 * @namespace WebURI
 */
export namespace WebURI {
  /**
   * Check if a URL is valid.
   *
   * @param {string} url - The URL to validate.
   * @returns {boolean} True if the URL is valid, false otherwise.
   */
  export function isValid(url: string): boolean {
    const URL_REGEX =
      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_+.~#?&//=]*)/gm

    return URL_REGEX.test(url)
  }

  /**
   * Split links from a message string.
   *
   * @param {string} message - The message string to extract links from.
   * @returns {({ link: string } | string)[]} An array containing objects with links and non-link strings.
   */
  export const splitLinkFromMessage = (message: string): ({ link: string } | string)[] => {
    const result = message.split(' ').reduce(
      (acc, item) => {
        const isURL = isValid(item)
        if (isURL) acc.push({ link: item })
        else {
          if (typeof acc.slice(-1)[0] === 'string') {
            acc = [...acc.slice(0, -1), `${acc.slice(-1)[0]} ${item}`]
          } else {
            acc.push(item)
          }
        }

        return acc
      },
      [] as ({ link: string } | string)[],
    )

    return result
  }
}
