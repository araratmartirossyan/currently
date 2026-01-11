<script setup lang="ts">
import { Toaster } from "@/components/ui/sonner";
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster />
</template>

<style>
@import "@/assets/css/tailwind.css";
@import "@vuepic/vue-datepicker/dist/main.css";
</style>
