<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Project, Task } from "@/types";

defineProps<{
  projects: Project[];
  selectedProjectId: string | null;
  selectedDateRange: "all" | "today" | "tomorrow" | "7" | "30";
  upcomingDeadlines: Task[];
}>();

const emit = defineEmits<{
  (e: "select-project", id: string | null): void;
  (e: "select-date", range: "all" | "today" | "tomorrow" | "7" | "30"): void;
}>();
</script>

<template>
  <Card class="border-none bg-slate-50/80 shadow-sm">
    <CardContent class="space-y-6 p-4 text-sm text-slate-700">
      <div class="space-y-3">
        <p class="text-xs tracking-[0.2em] text-slate-500 uppercase">Projects</p>
        <div class="space-y-2">
          <button
            class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left transition hover:bg-white/70"
            :class="!selectedProjectId ? 'font-semibold text-slate-900' : 'text-slate-700'"
            @click="emit('select-project', null)"
          >
            <span class="size-2 rounded-full bg-slate-300"></span>
            <span>All Projects</span>
          </button>
          <button
            v-for="project in projects"
            :key="project.id"
            class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left transition hover:bg-white/70"
            :class="
              project.id === selectedProjectId ? 'font-semibold text-slate-900' : 'text-slate-700'
            "
            @click="emit('select-project', project.id)"
          >
            <span
              class="size-2 rounded-full"
              :style="{ backgroundColor: project.color || '#cbd5e1' }"
            ></span>
            <span>{{ project.name }}</span>
          </button>
        </div>
      </div>

      <div class="space-y-3">
        <p class="text-xs tracking-[0.2em] text-slate-500 uppercase">Date Filters</p>
        <div class="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            :class="selectedDateRange === 'all' ? 'bg-white' : ''"
            @click="emit('select-date', 'all')"
            >All</Button
          >
          <Button
            variant="outline"
            size="sm"
            :class="selectedDateRange === 'today' ? 'bg-white' : ''"
            @click="emit('select-date', 'today')"
            >Today</Button
          >
          <Button
            variant="outline"
            size="sm"
            :class="selectedDateRange === 'tomorrow' ? 'bg-white' : ''"
            @click="emit('select-date', 'tomorrow')"
            >Tomorrow</Button
          >
          <Button
            variant="outline"
            size="sm"
            :class="selectedDateRange === '7' ? 'bg-white' : ''"
            @click="emit('select-date', '7')"
            >7 days</Button
          >
          <Button
            variant="outline"
            size="sm"
            :class="selectedDateRange === '30' ? 'bg-white' : ''"
            @click="emit('select-date', '30')"
            >30 days</Button
          >
        </div>
      </div>

      <div class="space-y-3">
        <p class="text-xs tracking-[0.2em] text-slate-500 uppercase">Reminders (3 days)</p>
        <div class="space-y-2 text-sm text-slate-700">
          <div v-if="!upcomingDeadlines.length" class="text-xs text-slate-400">
            No deadlines in next 3 days
          </div>
          <div
            v-for="t in upcomingDeadlines"
            :key="t.id"
            class="flex items-center justify-between gap-2 rounded-md bg-white/70 px-2 py-1"
          >
            <span class="truncate">{{ t.title || "Task" }}</span>
            <Badge variant="outline" class="border-slate-200 text-xs text-slate-500">
              {{ t.deadline ? format(new Date(t.deadline), "MMM dd") : "" }}
            </Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
