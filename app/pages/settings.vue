<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ColorModePreference = "light" | "dark" | "system";

const colorMode = useColorMode();

function setTheme(next: ColorModePreference) {
  colorMode.preference = next;
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-8">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Settings</h2>
      <p class="text-muted-foreground">Customize your app experience.</p>
    </div>

    <Separator />

    <div class="grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription> Customize the look and feel of your dashboard. </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="space-y-0.5">
              <p class="text-sm font-medium">Theme</p>
              <p class="text-muted-foreground text-sm">Switch between light and dark mode.</p>
            </div>

            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                class="cursor-pointer"
                :disabled="colorMode.preference === 'light'"
                @click="setTheme('light')"
              >
                Light
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="cursor-pointer"
                :disabled="colorMode.preference === 'dark'"
                @click="setTheme('dark')"
              >
                Dark
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="cursor-pointer"
                :disabled="colorMode.preference === 'system'"
                @click="setTheme('system')"
              >
                Auto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
