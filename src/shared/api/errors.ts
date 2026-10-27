/** Error envelope every endpoint returns on 4xx. */
export type ApiErrorCode = 'VALIDATION_ERROR' | 'CONFLICT' | 'NOT_FOUND'

export interface ApiErrorDetail {
  code: string
  field?: string
  message: string
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    details?: ApiErrorDetail[]
  }
}
