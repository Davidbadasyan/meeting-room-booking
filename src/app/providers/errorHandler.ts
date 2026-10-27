import type { Plugin } from 'vue'
import { toast } from '@/shared/ui'

const UNEXPECTED_ERROR_MESSAGE = 'Something went wrong. Please try again or reload the page.'

/** Last line of defence for errors no component handled: log them and tell the user. */
export const errorHandlerProvider: Plugin = {
  install(app) {
    app.config.errorHandler = (error, _instance, info) => {
      console.error(`[app] ${info}`, error)
      toast.error(UNEXPECTED_ERROR_MESSAGE)
    }
  },
}
