import { z } from 'zod'

/** Error envelope every endpoint returns on 4xx. */
const apiErrorDetailSchema = z.object({
  code: z.string(),
  field: z.string().optional(),
  message: z.string(),
})

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.enum(['VALIDATION_ERROR', 'CONFLICT', 'NOT_FOUND']),
    message: z.string(),
    details: z.array(apiErrorDetailSchema).optional(),
  }),
})

export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>
export type ApiErrorCode = ApiErrorBody['error']['code']
