<script setup lang="ts">
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardLayoutContent from "@/components/DashboardLayoutContent.vue";
</script>

<template>
  <SidebarProvider :default-open="false">
    <DashboardLayoutContent>
      <slot />
    </DashboardLayoutContent>
  </SidebarProvider>
</template>
