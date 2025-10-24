interface CheckResult {
  status: 'INDEXED' | 'NOT_INDEXED' | 'ERROR'
  title: string
  snippet: string
  reason: string | null
}

/**
 * Checks if a URL is indexed on Google using the Programmable Search API
 * @param url - The exact URL to check
 * @param key - Google API key
 * @param cx - Custom Search Engine ID
 * @returns Status, title, snippet, and reason
 */
export async function checkIndexExact(
  url: string,
  key: string,
  cx: string
): Promise<CheckResult> {
  if (!key || !cx) {
    return {
      status: 'ERROR',
      title: '',
      snippet: '',
      reason: 'Missing Google API credentials',
    }
  }

  try {
    // Build the query with exact URL match
    const q = `"${url}"`
    const endpoint = new URL('https://www.googleapis.com/customsearch/v1')
    endpoint.searchParams.set('key', key)
    endpoint.searchParams.set('cx', cx)
    endpoint.searchParams.set('q', q)
    endpoint.searchParams.set('num', '3')

    // Make the API request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const res = await fetch(endpoint.toString(), {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle HTTP errors
      if (!res.ok) {
        const errorText = await res.text()
        let errorMessage = `API error: ${res.status}`

        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error?.message) {
            errorMessage = errorData.error.message
          }
        } catch {
          // Couldn't parse error, use default message
        }

        return {
          status: 'ERROR',
          title: '',
          snippet: '',
          reason: errorMessage.slice(0, 200),
        }
      }

      // Parse response
      const data = await res.json()
      const items = data.items ?? []

      // Look for exact match (ignoring single trailing slash)
      const normalizedUrl = url.replace(/\/$/, '')
      const match = items.find((item: any) => {
        const itemLink = item?.link?.replace(/\/$/, '')
        return itemLink === normalizedUrl
      })

      if (match) {
        return {
          status: 'INDEXED',
          title: (match.title ?? '').slice(0, 500),
          snippet: (match.snippet ?? '').replace(/\n/g, ' ').slice(0, 500),
          reason: null,
        }
      }

      return {
        status: 'NOT_INDEXED',
        title: '',
        snippet: '',
        reason: 'No exact match found in Google results',
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    // Handle network errors, timeouts, etc.
    let errorMessage = 'Unknown error'

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout (15s)'
      } else {
        errorMessage = error.message
      }
    }

    return {
      status: 'ERROR',
      title: '',
      snippet: '',
      reason: errorMessage.slice(0, 200),
    }
  }
}

/**
 * Sleep helper for retry backoff
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Checks index with exponential backoff retry on rate limits and server errors
 */
export async function checkIndexWithRetry(
  url: string,
  key: string,
  cx: string,
  maxRetries = 3
): Promise<CheckResult> {
  let lastError: CheckResult | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await checkIndexExact(url, key, cx)

    // If successful or not a retriable error, return immediately
    if (result.status !== 'ERROR') {
      return result
    }

    // Check if error is retriable (rate limit or server error)
    const isRetriable =
      result.reason?.includes('429') ||
      result.reason?.includes('500') ||
      result.reason?.includes('502') ||
      result.reason?.includes('503') ||
      result.reason?.includes('timeout')

    if (!isRetriable || attempt === maxRetries) {
      return result
    }

    lastError = result

    // Exponential backoff with jitter: 1s, 2s, 4s
    const baseDelay = Math.pow(2, attempt) * 1000
    const jitter = Math.random() * 500
    await sleep(baseDelay + jitter)
  }

  return lastError!
}
