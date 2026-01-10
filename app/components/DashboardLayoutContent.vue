<script setup lang="ts">
import AppSidebar from "@/components/AppSidebar.vue";
import TaskCreateForm from "@/components/task-create/TaskCreateForm.vue";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Plus, ChevronDown, Check } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTaskStore } from "@/stores/tasks";
import { useProjectStore } from "@/stores/projects";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

const { isMobile, setOpen, open } = useSidebar();
const route = useRoute();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const { projects } = storeToRefs(projectStore);
const { selectedProjectId } = storeToRefs(taskStore);

const currentProjectName = computed(() => {
  if (!selectedProjectId.value) return "All Projects";
  return projects.value.find((p) => p.id === selectedProjectId.value)?.name || "Unknown Project";
});

const isSidebarOpen = computed(() => open.value);

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
</script>

<template>
  <AppSidebar />
  <SidebarInset>
    <!-- Desktop Overlay Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-linear"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300 ease-linear"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isSidebarOpen && !isMobile"
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-all"
        @click="setOpen(false)"
      ></div>
    </Transition>

    <header
      class="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear"
    >
      <div class="flex w-full items-center gap-2 px-4">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <BreadcrumbLink as-child>
                <NuxtLink to="/">Currently</NuxtLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <template v-for="(breadcrumb, index) in breadcrumbs" :key="breadcrumb.url">
              <BreadcrumbSeparator class="hidden md:block" />
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

        <div class="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm" class="h-8 gap-1 pr-2">
                {{ currentProjectName }}
                <ChevronDown class="size-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-48">
              <DropdownMenuItem @click="taskStore.setSelectedProject(null)">
                <div class="flex flex-1 items-center gap-2">
                  <span>All Projects</span>
                </div>
                <Check v-if="!selectedProjectId" class="ml-auto size-3.5" />
              </DropdownMenuItem>
              <DropdownMenuItem
                v-for="project in projects"
                :key="project.id"
                @click="taskStore.setSelectedProject(project.id)"
              >
                <div class="flex flex-1 items-center gap-2">
                  <span>{{ project.name }}</span>
                </div>
                <Check v-if="selectedProjectId === project.id" class="ml-auto size-3.5" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet v-model:open="isCreateTaskOpen">
            <Button
              size="sm"
              variant="outline"
              class="hidden h-8 sm:flex"
              @click="isCreateTaskOpen = true"
            >
              <Plus class="mr-2 size-4" />
              New Task
            </Button>
            <Button
              size="icon"
              variant="outline"
              class="sm:hidden"
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
  </SidebarInset>
</template>
