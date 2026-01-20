<script setup lang="ts">
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Project } from "@/types";

interface Props {
  projects: Project[];
  selectedProjectId: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "selectProject", id: string | null): void;
}>();

const allProjects = computed(() => [
  { id: null, name: "All", color: null },
  ...props.projects,
]);
</script>

<template>
  <div class="w-full">
    <ScrollArea class="w-full whitespace-nowrap">
      <div class="flex gap-2 pb-2">
        <Button
          v-for="project in allProjects"
          :key="project.id || 'all'"
          variant="outline"
          size="sm"
          :class="[
            'cursor-pointer shrink-0',
            selectedProjectId === project.id
              ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground'
              : 'hover:bg-muted',
          ]"
          @click="emit('selectProject', project.id)"
        >
          <span
            v-if="project.color"
            class="mr-2 inline-block h-2 w-2 rounded-full"
            :style="{ backgroundColor: project.color }"
          ></span>
          {{ project.name }}
        </Button>
      </div>
    </ScrollArea>
  </div>
</template>
