<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project, Task } from "@/types";
import { formatTaskLastDay } from "@/helpers/tasks/display";

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
  <Card class="bg-card/70 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/50">
    <CardContent class="space-y-6 p-4 text-sm text-foreground">
      <div class="space-y-3">
        <p class="text-xs tracking-[0.2em] text-muted-foreground uppercase">Projects</p>
        <div class="space-y-2">
          <button
            class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left transition hover:bg-muted/60"
            :class="!selectedProjectId ? 'font-semibold text-foreground' : 'text-muted-foreground'"
            @click="emit('select-project', null)"
          >
            <span class="size-2 rounded-full bg-muted-foreground/40"></span>
            <span>All Projects</span>
          </button>
          <button
            v-for="project in projects"
            :key="project.id"
            class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left transition hover:bg-muted/60"
            :class="
              project.id === selectedProjectId ? 'font-semibold text-foreground' : 'text-muted-foreground'
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
        <p class="text-xs tracking-[0.2em] text-muted-foreground uppercase">Date Filters</p>
        <div class="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            :class="selectedDateRange === 'all' ? 'bg-muted/50' : ''"
            @click="emit('select-date', 'all')"
            >All</Button
          >
          <Button
            variant="outline"
            size="sm"
            :class="selectedDateRange === 'today' ? 'bg-muted/50' : ''"
            @click="emit('select-date', 'today')"
            >Today</Button
          >
          <Button
            variant="outline"
            size="sm"
            :class="selectedDateRange === 'tomorrow' ? 'bg-muted/50' : ''"
            @click="emit('select-date', 'tomorrow')"
            >Tomorrow</Button
          >
          <Button
            variant="outline"
            size="sm"
            :class="selectedDateRange === '7' ? 'bg-muted/50' : ''"
            @click="emit('select-date', '7')"
            >7 days</Button
          >
          <Button
            variant="outline"
            size="sm"
            :class="selectedDateRange === '30' ? 'bg-muted/50' : ''"
            @click="emit('select-date', '30')"
            >30 days</Button
          >
        </div>
      </div>

      <div class="space-y-3">
        <p class="text-xs tracking-[0.2em] text-muted-foreground uppercase">Reminders (3 days)</p>
        <div class="space-y-2 text-sm text-muted-foreground">
          <div v-if="!upcomingDeadlines.length" class="text-xs text-muted-foreground/60">
            No reminders in next 3 days
          </div>
          <div
            v-for="t in upcomingDeadlines"
            :key="t.id"
            class="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1"
          >
            <span class="truncate text-foreground">{{ t.title || "Task" }}</span>
            <Badge variant="outline" class="text-xs">
              {{ formatTaskLastDay(t) }}
            </Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
