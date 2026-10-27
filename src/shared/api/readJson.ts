/** `json()` throws on an empty or malformed body; callers validate the result with zod anyway. */
export async function readJson(source: { json: () => Promise<unknown> }): Promise<unknown> {
  try {
    return await source.json()
  } catch {
    return undefined
  }
}
