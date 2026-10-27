import { isRealDate, type IsoDate } from '@/shared/lib/time'

const DATE_PARAM = 'date'

/** The `?date=YYYY-MM-DD` from a query string; undefined when missing or not a real date. */
export function readDateParam(search: string): IsoDate | undefined {
  const value = new URLSearchParams(search).get(DATE_PARAM)
  if (value === null) return undefined
  if (!isRealDate(value)) return undefined

  return value
}

/** The query string with `date` set, or removed when undefined. Other parameters are kept. */
export function withDateParam(search: string, date: IsoDate | undefined): string {
  const params = new URLSearchParams(search)
  params.delete(DATE_PARAM)
  if (date !== undefined) params.set(DATE_PARAM, date)

  const query = params.toString()
  if (query === '') return ''
  return `?${query}`
}
