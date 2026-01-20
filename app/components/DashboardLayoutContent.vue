<script setup lang="ts">
import TaskCreateForm from "@/components/task-create/TaskCreateForm.vue";
import ThemeToggle from "@/components/ThemeToggle.vue";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  ChevronDown,
  Check,
  ListTodo,
  CalendarDays,
  FolderKanban,
  Settings,
  LogOut,
  BadgeCheck,
  GalleryVerticalEnd,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTaskStore } from "@/stores/tasks";
import { useProjectStore } from "@/stores/projects";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const route = useRoute();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const { projects } = storeToRefs(projectStore);
const { selectedProjectId } = storeToRefs(taskStore);

const currentProjectName = computed(() => {
  if (!selectedProjectId.value) return "All Projects";
  return projects.value.find((p) => p.id === selectedProjectId.value)?.name || "Unknown Project";
});

const isCreateTaskOpen = ref(false);

const breadcrumbs = computed(() => {
  const paths = route.path.split("/").filter(Boolean);
  return paths.map((path, index) => {
    const url = "/" + paths.slice(0, index + 1).join("/");
    const title = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
    return { title, url };
  });
});

const isTasksDashboardRoute = computed(() => route.path === "/");
const isOwner = computed(() => Boolean(user.value));

const navItems = computed(() => {
  if (!user.value) {
    return [
      {
        title: "Calendar",
        url: "/calendar",
        icon: CalendarDays,
      },
    ];
  }
  return [
    {
      title: "Tasks",
      url: "/",
      icon: ListTodo,
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: CalendarDays,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: FolderKanban,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];
});

const displayName = computed(() => user.value?.email?.split("@")[0] || "Guest");
const displayEmail = computed(() => user.value?.email || "Read-only calendar");
const avatarUrl = computed(() => {
  const name = encodeURIComponent(displayName.value || "Guest");
  return `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`;
});

const handleLogout = async () => {
  try {
    await supabase.auth.signOut();
    toast.success("Logged out");
    await navigateTo("/calendar");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to log out";
    toast.error(message);
  }
};
</script>

<template>
  <div class="flex h-screen flex-col">
    <header
      class="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear sm:h-16"
    >
      <div class="flex w-full items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <!-- Logo/Brand -->
        <NuxtLink
          to="/"
          class="flex shrink-0 items-center gap-2 font-semibold hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div
            class="bg-primary text-primary-foreground flex aspect-square size-7 items-center justify-center rounded-lg sm:size-8"
          >
            <GalleryVerticalEnd class="size-3.5 sm:size-4" />
          </div>
          <span class="hidden text-sm sm:inline sm:text-base">Currently</span>
        </NuxtLink>

        <Separator orientation="vertical" class="h-5 sm:h-6" />

        <!-- Navigation Links -->
        <nav class="flex items-center gap-0.5 sm:gap-1">
          <Button
            v-for="item in navItems"
            :key="item.title"
            as-child
            variant="ghost"
            size="sm"
            class="cursor-pointer h-8 px-2 sm:h-9 sm:px-3"
          >
            <NuxtLink :to="item.url" class="flex items-center gap-1.5 sm:gap-2">
              <component :is="item.icon" class="size-3.5 sm:size-4" />
              <span class="hidden text-xs md:inline md:text-sm">{{ item.title }}</span>
            </NuxtLink>
          </Button>
        </nav>

        <Separator orientation="vertical" class="h-5 hidden sm:h-6 lg:block" />

        <!-- Breadcrumbs (hidden on mobile) -->
        <Breadcrumb class="hidden lg:block">
          <BreadcrumbList>
            <template v-for="(breadcrumb, index) in breadcrumbs" :key="breadcrumb.url">
              <BreadcrumbSeparator v-if="index > 0" />
              <BreadcrumbItem>
                <BreadcrumbLink v-if="index < breadcrumbs.length - 1" as-child>
                  <NuxtLink :to="breadcrumb.url">{{ breadcrumb.title }}</NuxtLink>
                </BreadcrumbLink>
                <BreadcrumbPage v-else>{{ breadcrumb.title }}</BreadcrumbPage>
              </BreadcrumbItem>
            </template>
            <BreadcrumbItem v-if="breadcrumbs.length === 0">
              <BreadcrumbPage>Tasks</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <!-- Right side actions -->
        <div class="ml-auto flex items-center gap-1.5 sm:gap-2">
          <!-- Project Filter (Hidden on mobile - using carousel instead) -->
          <DropdownMenu v-if="isOwner">
            <DropdownMenuTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="hidden h-8 gap-1 pr-2 cursor-pointer lg:flex"
              >
                <span>{{ currentProjectName }}</span>
                <ChevronDown class="size-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-48">
              <DropdownMenuItem class="cursor-pointer" @click="taskStore.setSelectedProject(null)">
                <div class="flex flex-1 items-center gap-2">
                  <span>All Projects</span>
                </div>
                <Check v-if="!selectedProjectId" class="ml-auto size-3.5" />
              </DropdownMenuItem>
              <DropdownMenuItem
                v-for="project in projects"
                :key="project.id"
                class="cursor-pointer"
                @click="taskStore.setSelectedProject(project.id)"
              >
                <div class="flex flex-1 items-center gap-2">
                  <span>{{ project.name }}</span>
                </div>
                <Check v-if="selectedProjectId === project.id" class="ml-auto size-3.5" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Theme Toggle -->
          <ThemeToggle />

          <!-- Create Task Button -->
          <Sheet v-if="isOwner" v-model:open="isCreateTaskOpen">
            <Button
              size="sm"
              variant="outline"
              class="hidden h-8 cursor-pointer sm:flex"
              @click="isCreateTaskOpen = true"
            >
              <Plus class="mr-2 size-4" />
              New Task
            </Button>
            <Button
              size="icon"
              variant="outline"
              class="h-8 w-8 cursor-pointer sm:hidden"
              @click="isCreateTaskOpen = true"
            >
              <Plus class="size-4" />
            </Button>
            <SheetContent side="right" class="w-full overflow-y-auto sm:max-w-[520px]">
              <SheetHeader class="mb-4">
                <SheetTitle>Create Task</SheetTitle>
              </SheetHeader>
              <TaskCreateForm
                @created="isCreateTaskOpen = false"
                @cancel="isCreateTaskOpen = false"
              />
            </SheetContent>
          </Sheet>

          <!-- User Menu -->
          <DropdownMenu v-if="user">
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 rounded-full p-0 cursor-pointer sm:h-9 sm:w-9"
              >
                <Avatar class="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarImage :src="avatarUrl" :alt="displayName" />
                  <AvatarFallback>{{ displayName.slice(0, 2).toUpperCase() }}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuLabel class="font-normal">
                <div class="flex flex-col space-y-1">
                  <p class="text-sm font-medium leading-none">{{ displayName }}</p>
                  <p class="text-xs leading-none text-muted-foreground">{{ displayEmail }}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem as-child class="cursor-pointer">
                  <NuxtLink to="/settings" class="flex w-full items-center">
                    <BadgeCheck class="mr-2 size-4" />
                    Account
                  </NuxtLink>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                @click="handleLogout"
              >
                <LogOut class="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Sign In Button (for guests) -->
          <Button v-else as-child variant="outline" size="sm" class="h-8 cursor-pointer">
            <NuxtLink to="/login">Sign in</NuxtLink>
          </Button>
        </div>
      </div>
    </header>

    <main
      :class="[
        'bg-muted/10 flex min-h-0 flex-1 flex-col gap-4 p-4 lg:p-6',
        isTasksDashboardRoute ? 'overflow-hidden' : 'overflow-auto',
      ]"
    >
      <slot />
    </main>
  </div>
</template>
