<script setup lang="ts">
import { useRouter } from "vue-router";
import TaskCreateForm from "@/components/task-create/TaskCreateForm.vue";

const router = useRouter();
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold">Add New Task</h1>
      <p class="text-muted-foreground text-sm">
        This page is kept for deep links. Prefer using the drawer.
      </p>
    </div>
    <TaskCreateForm mode="page" @created="router.push('/')" @cancel="router.push('/')" />
  </div>
</template>
