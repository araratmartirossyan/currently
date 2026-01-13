<script setup lang="ts">
import { Sun, Moon, Monitor } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const colorMode = useColorMode();

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
] as const;

const currentTheme = computed(() => {
  return themes.find((t) => t.value === colorMode.preference) || themes[2];
});

const setTheme = (theme: "light" | "dark" | "system") => {
  colorMode.preference = theme;
};
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="sm" class="h-8 w-8 px-0 cursor-pointer">
        <component :is="currentTheme.icon" class="h-[1.2rem] w-[1.2rem]" />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        v-for="theme in themes"
        :key="theme.value"
        class="cursor-pointer"
        @click="setTheme(theme.value)"
      >
        <component :is="theme.icon" class="mr-2 h-4 w-4" />
        <span>{{ theme.label }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
