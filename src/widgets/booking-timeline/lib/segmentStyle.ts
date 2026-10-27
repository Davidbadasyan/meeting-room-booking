import { REM_PER_MINUTE } from '@/widgets/booking-timeline/config/timeline'

/** Height used by the desktop timeline (`md:grid md:min-h-(--segment-height)`); mobile ignores it. */
export function segmentStyle(durationInMinutes: number) {
  return { '--segment-height': `${durationInMinutes * REM_PER_MINUTE}rem` }
}
