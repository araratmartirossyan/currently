import { computed, type Ref } from "vue";
import { format, isSameDay, startOfDay, endOfDay } from "date-fns";
import { RRule } from "rrule";
import type { CalendarEvent } from "@/types";
import { getEventStartDate } from "@/helpers/calendar/display";

interface DayEvent {
  type: "task" | "meeting";
  time: string;
  endTime: string;
  title: string;
  project?: string;
  meeting: CalendarEvent;
}

interface Options {
  selectedDate: Ref<Date>;
  meetings: Ref<CalendarEvent[]>;
  projectNameById: Ref<Record<string, string>>;
}

export function useDayCalendar({ selectedDate, meetings, projectNameById }: Options) {
  const dayEvents = computed<DayEvent[]>(() => {
    const dayStart = startOfDay(selectedDate.value);
    const dayEnd = endOfDay(selectedDate.value);
    const events: DayEvent[] = [];

    // Process each meeting
    meetings.value.forEach((meeting) => {
      const meetingDate = getEventStartDate(meeting);
      if (!meetingDate) return;

      // Extract original time components
      const originalHours = meetingDate.getHours();
      const originalMinutes = meetingDate.getMinutes();

      // Calculate end time
      const meetingEndDate = meeting.end_at ? new Date(meeting.end_at) : null;
      const endHours = meetingEndDate?.getHours() ?? originalHours + 1;
      const endMinutes = meetingEndDate?.getMinutes() ?? originalMinutes;

      // Handle recurring events
      if (meeting.rrule) {
        const recurringEvents = processRecurringEvent(
          meeting,
          meetingDate,
          dayStart,
          dayEnd,
          selectedDate.value,
          originalHours,
          originalMinutes,
          endHours,
          endMinutes,
          projectNameById.value
        );
        events.push(...recurringEvents);
      } else {
        // Handle single event
        if (isSameDay(meetingDate, dayStart)) {
          events.push(
            createDayEvent(
              meeting,
              meetingDate,
              meetingEndDate,
              originalHours,
              originalMinutes,
              endHours,
              endMinutes,
              projectNameById.value
            )
          );
        }
      }
    });

    // Sort events by time
    return events.sort((a, b) => {
      if (a.time === "All day") return -1;
      if (b.time === "All day") return 1;
      return a.time.localeCompare(b.time);
    });
  });

  return {
    dayEvents,
  };
}

function processRecurringEvent(
  meeting: CalendarEvent,
  meetingDate: Date,
  dayStart: Date,
  dayEnd: Date,
  selectedDate: Date,
  originalHours: number,
  originalMinutes: number,
  endHours: number,
  endMinutes: number,
  projectNameById: Record<string, string>
): DayEvent[] {
  const events: DayEvent[] = [];

  try {
    // Parse rrule with dtstart
    const rruleOptions = RRule.parseString(meeting.rrule!);
    rruleOptions.dtstart = meetingDate;
    const rrule = new RRule(rruleOptions);

    // Get occurrences for this day
    const occurrences = rrule.between(dayStart, dayEnd, true);

    occurrences.forEach((occurrence) => {
      // Check if excluded
      const isExcluded = meeting.exdates?.some((exdate) =>
        isSameDay(new Date(exdate), occurrence)
      );

      if (!isExcluded) {
        // Create event with original time on selected date
        const eventDateTime = new Date(selectedDate);
        eventDateTime.setHours(originalHours, originalMinutes, 0, 0);

        const eventEndDateTime = new Date(selectedDate);
        eventEndDateTime.setHours(endHours, endMinutes, 0, 0);

        events.push({
          type: "meeting",
          time: format(eventDateTime, "h:mm a"),
          endTime: format(eventEndDateTime, "h:mm a"),
          title: meeting.title || "Untitled meeting",
          project: meeting.project_id ? projectNameById[meeting.project_id] : undefined,
          meeting,
        });
      }
    });
  } catch (error) {
    console.error("Error parsing rrule:", error);
    // Fallback to single event
    if (isSameDay(meetingDate, dayStart)) {
      const meetingEndDate = meeting.end_at ? new Date(meeting.end_at) : null;
      events.push(
        createDayEvent(
          meeting,
          meetingDate,
          meetingEndDate,
          originalHours,
          originalMinutes,
          endHours,
          endMinutes,
          projectNameById
        )
      );
    }
  }

  return events;
}

function createDayEvent(
  meeting: CalendarEvent,
  startDate: Date,
  endDate: Date | null,
  originalHours: number,
  originalMinutes: number,
  endHours: number,
  endMinutes: number,
  projectNameById: Record<string, string>
): DayEvent {
  const calculatedEndDate = endDate || new Date(startDate.getTime() + 60 * 60 * 1000);

  return {
    type: "meeting",
    time: format(startDate, "h:mm a"),
    endTime: format(calculatedEndDate, "h:mm a"),
    title: meeting.title || "Untitled meeting",
    project: meeting.project_id ? projectNameById[meeting.project_id] : undefined,
    meeting,
  };
}
