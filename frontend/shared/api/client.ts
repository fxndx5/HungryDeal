function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

export const API_BASE = `${getBaseUrl()}/api/v1`

export class ApiError extends Error {
  constructor(message: string, public status: number, public detail?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { revalidate?: number },
): Promise<T> {
  const { revalidate, ...fetchOptions } = options ?? {}

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers: { 'Content-Type': 'application/json', ...fetchOptions.headers },
    next: revalidate != null ? { revalidate } : { revalidate: 0 },
  })

  if (!res.ok) {
    let detail: string | undefined
    try {
      const body = await res.json()
      detail = body?.detail
    } catch {}
    throw new ApiError(`Error ${res.status}: ${detail ?? res.statusText}`, res.status, detail)
  }

  return res.json() as Promise<T>
}
