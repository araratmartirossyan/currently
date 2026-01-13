import { differenceInCalendarDays, startOfDay, isValid } from "date-fns";
import type { CalendarEvent } from "@/types";

/**
 * Get the start date of a calendar event
 * @param event - Calendar event
 * @returns Date object or null
 */
export function getEventStartDate(event: CalendarEvent): Date | null {
  if (!event.start_at) return null;
  const d = new Date(event.start_at);
  return isValid(d) ? d : null;
}

/**
 * Filter upcoming meetings/events within a date range
 * @param events - Array of calendar events
 * @param daysAhead - Number of days to look ahead (default: 3)
 * @returns Filtered and sorted array of upcoming events
 */
export function getUpcomingMeetings(
  events: CalendarEvent[],
  daysAhead: number = 3
): CalendarEvent[] {
  const today = startOfDay(new Date());

  return events
    .filter((event) => {
      const startDate = getEventStartDate(event);
      if (!startDate) return false;

      const diffDays = differenceInCalendarDays(startOfDay(startDate), today);
      // Include events from 1 to daysAhead days from now
      return diffDays >= 1 && diffDays <= daysAhead;
    })
    .sort((a, b) => {
      const dateA = getEventStartDate(a);
      const dateB = getEventStartDate(b);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
}
