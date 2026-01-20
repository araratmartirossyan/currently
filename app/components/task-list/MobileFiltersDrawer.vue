<script setup lang="ts">
import { ref } from "vue";
import { Filter } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUSES, type TaskStatusFilter } from "@/constants/tasks";
import type { SortOption } from "@/composables/useTaskFilters";

interface Props {
  selectedStatus: TaskStatusFilter;
  sortBy: SortOption;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "updateStatus", value: TaskStatusFilter): void;
  (e: "updateSort", value: SortOption): void;
}>();

const open = ref(false);

const sortOptions = [
  { value: "created", label: "Created Date" },
  { value: "date", label: "Due Date" },
  { value: "status", label: "Status" },
] as const;

const handleApply = () => {
  open.value = false;
};

const handleReset = () => {
  emit("updateStatus", "all");
  emit("updateSort", "created");
};
</script>

<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child>
      <Button variant="outline" size="sm" class="cursor-pointer">
        <Filter class="h-4 w-4" />
      </Button>
    </SheetTrigger>
    <SheetContent side="bottom" class="rounded-t-[20px]">
      <SheetHeader class="mb-6">
        <SheetTitle class="text-center text-xl">Filters</SheetTitle>
      </SheetHeader>

      <div class="space-y-6 pb-4">
        <!-- Status Filter -->
        <div class="space-y-3">
          <Label class="text-base font-semibold">Status</Label>
          <Select
            :model-value="selectedStatus"
            @update:model-value="(v) => emit('updateStatus', v as TaskStatusFilter)"
          >
            <SelectTrigger class="h-12 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="status in TASK_STATUSES"
                :key="status.value"
                :value="status.value"
                class="cursor-pointer"
              >
                {{ status.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Sort By -->
        <div class="space-y-3">
          <Label class="text-base font-semibold">Sort by</Label>
          <Select
            :model-value="sortBy"
            @update:model-value="(v) => emit('updateSort', v as SortOption)"
          >
            <SelectTrigger class="h-12 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in sortOptions"
                :key="option.value"
                :value="option.value"
                class="cursor-pointer"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3 pt-4">
          <Button
            class="h-12 w-full cursor-pointer text-base font-semibold"
            @click="handleApply"
          >
            Apply
          </Button>
          <Button
            variant="ghost"
            class="h-12 w-full cursor-pointer text-base"
            @click="handleReset"
          >
            Reset
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
