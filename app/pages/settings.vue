<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-8">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Settings</h2>
      <p class="text-muted-foreground">Manage your account settings and preferences.</p>
    </div>

    <Separator />

    <div class="grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription> This is how others will see you on the platform. </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-2">
            <Label for="username">Username</Label>
            <Input id="username" placeholder="ararat" />
          </div>
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" />
          </div>
          <Button>Update Profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription> Customize the look and feel of your dashboard. </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Dark Mode</Label>
              <p class="text-muted-foreground text-sm">Toggle between light and dark themes.</p>
            </div>
            <Button variant="outline">System</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
