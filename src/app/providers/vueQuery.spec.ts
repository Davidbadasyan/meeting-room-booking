import { describe, expect, it } from 'vitest'
import { createQueryClient, shouldRetryQuery } from '@/app/providers/vueQuery'
import {
  ConflictError,
  NetworkError,
  NotFoundError,
  ServerError,
  ValidationError,
} from '@/shared/api'

describe('shouldRetryQuery', () => {
  it.each([
    ['NetworkError', new NetworkError(), true],
    ['ServerError', new ServerError('Boom'), true],
    ['ValidationError', new ValidationError('Bad'), false],
    ['NotFoundError', new NotFoundError('Gone'), false],
    ['ConflictError', new ConflictError('Taken'), false],
    ['a plain Error', new Error('Bug'), false],
  ])('after the first failure, retries %s: %s', (_, error, expected) => {
    expect(shouldRetryQuery(0, error)).toBe(expected)
  })

  it('never retries a second time', () => {
    expect(shouldRetryQuery(1, new NetworkError())).toBe(false)
  })
})

describe('createQueryClient', () => {
  function countAttempts(error: Error) {
    const queryClient = createQueryClient()
    let attempts = 0
    const query = queryClient.fetchQuery({
      queryKey: ['test'],
      retryDelay: 0,
      queryFn: () => {
        attempts += 1
        throw error
      },
    })
    return query.catch(() => attempts)
  }

  it('tries a query twice on a transient error', async () => {
    expect(await countAttempts(new NetworkError())).toBe(2)
    expect(await countAttempts(new ServerError('Boom'))).toBe(2)
  })

  it('tries a query once on a client error', async () => {
    expect(await countAttempts(new ValidationError('Bad'))).toBe(1)
  })

  it('never retries mutations', () => {
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false)
  })
})
