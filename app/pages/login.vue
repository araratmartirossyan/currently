<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const route = useRoute();

type Mode = "password" | "magic_link" | "reset";
const mode = ref<Mode>("magic_link");

const email = ref("");
const password = ref("");
const isSubmitting = ref(false);

const nextPath = computed(() => {
  const n = route.query.next;
  return typeof n === "string" && n.startsWith("/") ? n : "/";
});

watchEffect(() => {
  if (user.value) navigateTo(nextPath.value);
});

async function signIn() {
  if (!email.value.trim() || !password.value) return;
  isSubmitting.value = true;
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    });
    if (error) throw error;
    toast.success("Signed in");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to sign in";
    toast.error(message);
  } finally {
    isSubmitting.value = false;
  }
}

async function sendMagicLink() {
  if (!email.value.trim()) return;
  isSubmitting.value = true;
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/calendar`,
      },
    });
    if (error) throw error;
    toast.success("Magic link sent", {
      description: "Check your inbox and open the link to sign in.",
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to send magic link";
    toast.error(message);
  } finally {
    isSubmitting.value = false;
  }
}

async function sendPasswordReset() {
  if (!email.value.trim()) return;
  isSubmitting.value = true;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
    toast.success("Password reset email sent", {
      description: "Open the email to set a new password, then come back and sign in.",
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to send password reset";
    toast.error(message);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Owner access to manage tasks, projects, and meetings.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input id="email" v-model="email" type="email" placeholder="you@example.com" />
        </div>

        <div class="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            class="cursor-pointer"
            :disabled="isSubmitting"
            @click="mode = 'magic_link'"
          >
            Magic link
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="cursor-pointer"
            :disabled="isSubmitting"
            @click="mode = 'password'"
          >
            Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="cursor-pointer"
            :disabled="isSubmitting"
            @click="mode = 'reset'"
          >
            Reset password
          </Button>
        </div>

        <div v-if="mode === 'password'" class="grid gap-2">
          <Label for="password">Password</Label>
          <Input id="password" v-model="password" type="password" placeholder="••••••••" />
          <Button class="w-full" :disabled="isSubmitting" @click="signIn">Sign in</Button>
        </div>

        <div v-else-if="mode === 'magic_link'" class="grid gap-2">
          <p class="text-muted-foreground text-sm">
            We’ll email you a sign-in link (no password needed).
          </p>
          <Button class="w-full" :disabled="isSubmitting" @click="sendMagicLink"
            >Send magic link</Button
          >
        </div>

        <div v-else class="grid gap-2">
          <p class="text-muted-foreground text-sm">Send an email to set a new password.</p>
          <Button class="w-full" :disabled="isSubmitting" @click="sendPasswordReset">
            Send password reset
          </Button>
        </div>

        <p class="text-muted-foreground text-center text-xs">
          Visitors can view your agenda at
          <NuxtLink to="/calendar" class="underline">/calendar</NuxtLink>.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
