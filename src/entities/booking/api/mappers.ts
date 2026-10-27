import type { BookingDraftRequestDto, BookingDto } from '@/entities/booking/api/dto'
import type { Booking, BookingDraft } from '@/entities/booking/model/booking'

/** The wire format matches the domain today; this is the one place to adapt if it changes. */
export function toDomain(dto: BookingDto): Booking {
  return { id: dto.id, date: dto.date, start: dto.start, end: dto.end, title: dto.title }
}

/** An empty title tells the server to clear it on update. */
export function toDto(draft: BookingDraft): BookingDraftRequestDto {
  return { date: draft.date, start: draft.start, end: draft.end, title: draft.title ?? '' }
}
