import type { InjectionKey } from 'vue'

/** Where the current time comes from. Tests provide a fixed clock instead of the system one. */
export type Clock = () => Date

export const systemClock: Clock = () => new Date()

export const CLOCK_KEY: InjectionKey<Clock> = Symbol('Clock')
