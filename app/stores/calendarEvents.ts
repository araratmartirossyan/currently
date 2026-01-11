import { defineStore } from "pinia";
import type { CalendarEvent } from "@/types";
import { calendarEventService } from "@/services/api";
import type { Database } from "~/types/database.types";

type RangeKey = string;

export const useCalendarEventsStore = defineStore("calendarEvents", {
  state: () => ({
    events: [] as CalendarEvent[],
    isLoading: false,
    error: null as string | null,
    lastRangeKey: null as RangeKey | null,
  }),

  actions: {
    async fetchRange(startIso: string, endIso: string) {
      const rangeKey = `${startIso}__${endIso}`;
      if (this.lastRangeKey === rangeKey && this.events.length) return;

      this.isLoading = true;
      this.error = null;
      try {
        const data = await calendarEventService.getEventsInRange(startIso, endIso);
        this.events = data;
        this.lastRangeKey = rangeKey;
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : "Failed to load events";
      } finally {
        this.isLoading = false;
      }
    },

    async createEvent(payload: Database["public"]["Tables"]["calendar_events"]["Insert"]) {
      this.error = null;
      const created = await calendarEventService.createEvent(payload);
      this.events = [...this.events, created].sort((a, b) => a.start_at.localeCompare(b.start_at));
      return created;
    },

    async updateEvent(
      id: string,
      updates: Database["public"]["Tables"]["calendar_events"]["Update"]
    ) {
      this.error = null;
      const updated = await calendarEventService.updateEvent(id, updates);
      this.events = this.events.map((e) => (e.id === id ? updated : e));
      return updated;
    },

    async deleteEvent(id: string) {
      this.error = null;
      await calendarEventService.deleteEvent(id);
      this.events = this.events.filter((e) => e.id !== id);
    },

    async importFromFormData(form: FormData) {
      this.error = null;
      const res = await $fetch<{
        events: Database["public"]["Tables"]["calendar_events"]["Insert"][];
      }>("/api/calendar/import", { method: "POST", body: form });

      if (!res?.events?.length) return [];
      const upserted = await calendarEventService.upsertEvents(res.events, "source,source_uid");
      // Merge by id
      const byId = new Map<string, CalendarEvent>(this.events.map((e) => [e.id, e]));
      for (const e of upserted) byId.set(e.id, e);
      this.events = Array.from(byId.values()).sort((a, b) => a.start_at.localeCompare(b.start_at));
      return upserted;
    },
  },
});
