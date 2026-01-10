<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task } from "@/types";

defineProps<{
  todayList: Task[];
  upcomingList: Task[];
  statusColors: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "toggle" | "edit", task: Task): void;
}>();
</script>

<template>
  <Card class="border-none shadow-sm">
    <CardContent class="p-0">
      <ScrollArea class="h-[520px]">
        <div class="divide-y">
          <div
            v-for="task in todayList"
            :key="task.id"
            class="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-slate-50/80"
            @click="emit('edit', task)"
          >
            <Checkbox
              class="mt-1"
              :checked="task.status === 'completed'"
              @update:checked.stop="() => emit('toggle', task)"
            />
            <div class="flex-1 space-y-1">
              <div class="flex items-center gap-2">
                <p class="leading-tight font-medium text-slate-900">
                  {{ task.title || "Untitled task" }}
                </p>
                <Badge
                  variant="outline"
                  class="border-slate-200 text-slate-500"
                  v-if="task.project_id"
                >
                  {{ task.project_id }}
                </Badge>
              </div>
              <p class="line-clamp-2 text-sm text-slate-500">
                {{ task.description || "No description provided." }}
              </p>
            </div>
            <Badge
              variant="outline"
              :class="statusColors[task.status] || 'border-slate-200 bg-slate-100 text-slate-600'"
            >
              {{ task.status?.replace("_", " ") || "pending" }}
            </Badge>
          </div>
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
</template>
