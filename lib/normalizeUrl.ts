/**
 * Normalizes a URL for consistent comparison
 * - Lowercases scheme and host
 * - Strips fragments
 * - Keeps query string
 * - Removes trailing slash (except for root)
 * - Collapses multiple slashes
 */
export function normalizeUrl(url: string): string {
  try {
    // Basic cleanup
    url = url.trim()

    // Parse the URL
    const parsed = new URL(url)

    // Validate scheme
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL scheme. Only http and https are supported.')
    }

    // Lowercase scheme and host
    parsed.protocol = parsed.protocol.toLowerCase()
    parsed.hostname = parsed.hostname.toLowerCase()

    // Strip fragment
    parsed.hash = ''

    // Collapse multiple slashes in pathname
    parsed.pathname = parsed.pathname.replace(/\/+/g, '/')

    // Get the full URL
    let normalized = parsed.toString()

    // Remove trailing slash (except for root)
    if (normalized.endsWith('/') && parsed.pathname !== '/') {
      normalized = normalized.slice(0, -1)
    }

    return normalized
  } catch (error) {
    throw new Error(`Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    return ['http:', 'https:'].includes(parsed.protocol) && !!parsed.hostname
  } catch {
    return false
  }
}

/**
 * Parses multiple URLs from text (one per line)
 * Returns valid, normalized URLs and errors
 */
export function parseUrlList(
  text: string
): { valid: string[]; errors: Array<{ line: number; url: string; error: string }> } {
  const lines = text.split('\n').map((l) => l.trim())
  const valid: string[] = []
  const errors: Array<{ line: number; url: string; error: string }> = []

  lines.forEach((line, index) => {
    if (!line) return // Skip empty lines

    try {
      const normalized = normalizeUrl(line)
      valid.push(normalized)
    } catch (error) {
      errors.push({
        line: index + 1,
        url: line,
        error: error instanceof Error ? error.message : 'Invalid URL',
      })
    }
  })

  return { valid, errors }
}

/**
 * Deduplicates an array of URLs
 */
export function deduplicateUrls(urls: string[]): { unique: string[]; duplicates: number } {
  const seen = new Set<string>()
  const unique: string[] = []

  urls.forEach((url) => {
    if (!seen.has(url)) {
      seen.add(url)
      unique.push(url)
    }
  })

  return {
    unique,
    duplicates: urls.length - unique.length,
  }
}
