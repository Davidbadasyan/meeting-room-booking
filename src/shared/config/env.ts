/**
 * `mock`: the MSW worker serves /api in the browser (default, also used in production demos).
 * `http`: requests go to a real backend.
 */
export type ApiMode = 'mock' | 'http'

export const API_MODE: ApiMode = import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock'

/** Empty means same origin, which is what MSW intercepts. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
