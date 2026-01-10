<script setup lang="ts">
import { Card, CardContent } from "@/components/ui/card";

defineProps<{
  scheduleItems: {
    time: string;
    title: string;
    avatars: number;
    color: string;
  }[];
}>();
</script>

<template>
  <div class="space-y-3">
    <Card v-for="(item, idx) in scheduleItems" :key="idx" :class="['border', item.color]">
      <CardContent class="space-y-2 p-4">
        <p class="text-xs text-slate-500">{{ item.time }}</p>
        <p class="font-semibold text-slate-900">{{ item.title }}</p>
        <div class="flex items-center justify-between text-xs text-slate-500">
          <span>+ {{ item.avatars }} members</span>
          <span
            class="inline-flex items-center gap-1 rounded-full border border-slate-100 bg-white/70 px-2 py-0.5 text-slate-600"
          >
            • Reminder
          </span>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
