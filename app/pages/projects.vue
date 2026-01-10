<script setup lang="ts">
import { useProjectStore } from "@/stores/projects";
import { useTaskStore } from "@/stores/tasks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Plus, Loader2, Pencil, Trash2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { storeToRefs } from "pinia";
import { ref, onMounted } from "vue";
import { toast } from "vue-sonner";

const projectStore = useProjectStore();
const taskStore = useTaskStore();
const { projects } = storeToRefs(projectStore);
const { tasks } = storeToRefs(taskStore);

const isCreating = ref(false);
const isOpen = ref(false);
const newProjectName = ref("");

const isEditOpen = ref(false);
const editingProjectId = ref<string | null>(null);
const editProjectName = ref("");
const isUpdating = ref(false);

const isDeleteOpen = ref(false);
const deletingProjectId = ref<string | null>(null);
const isDeleting = ref(false);

const createProject = async () => {
  if (!newProjectName.value) return;

  isCreating.value = true;
  try {
    await projectStore.createProject({ name: newProjectName.value });
    toast.success("Project created successfully");
    newProjectName.value = "";
    isOpen.value = false;
  } catch (e) {
    console.error(e);
    toast.error("Failed to create project");
  } finally {
    isCreating.value = false;
  }
};

// Fetch projects on mount
onMounted(async () => {
  try {
    await Promise.all([projectStore.fetchProjects(), taskStore.fetchTasks()]);
  } catch (e) {
    console.error("Failed to fetch projects", e);
  }
});

const openEdit = (id: string, name: string) => {
  editingProjectId.value = id;
  editProjectName.value = name;
  isEditOpen.value = true;
};

const saveEdit = async () => {
  if (!editingProjectId.value) return;
  if (!editProjectName.value.trim()) return;

  isUpdating.value = true;
  try {
    await projectStore.updateProjectRemote(editingProjectId.value, {
      name: editProjectName.value.trim(),
    });
    toast.success("Project updated");
    isEditOpen.value = false;
  } catch (e) {
    console.error(e);
    toast.error("Failed to update project");
  } finally {
    isUpdating.value = false;
  }
};

const openDelete = (id: string) => {
  deletingProjectId.value = id;
  isDeleteOpen.value = true;
};

const confirmDelete = async () => {
  if (!deletingProjectId.value) return;
  isDeleting.value = true;
  try {
    await projectStore.deleteProjectRemote(deletingProjectId.value);
    toast.success("Project deleted");
    isDeleteOpen.value = false;
    deletingProjectId.value = null;
  } catch (e) {
    console.error(e);
    toast.error("Failed to delete project");
  } finally {
    isDeleting.value = false;
  }
};

const getProjectStats = (projectId: string) => {
  const projectTasks = tasks.value.filter((t) => t.project_id === projectId);
  const completed = projectTasks.filter((t) => t.status === "completed").length;
  const total = projectTasks.length;
  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Projects</h2>
        <p class="text-muted-foreground">Manage your projects and see progress.</p>
      </div>

      <Dialog v-model:open="isOpen">
        <DialogTrigger as-child>
          <Button>
            <Plus class="mr-2 size-4" />
            New Project
          </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription> Add a new project to organize your tasks. </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid gap-2">
              <Label for="name">Project Name</Label>
              <Input
                id="name"
                v-model="newProjectName"
                placeholder="e.g. Personal, Work, DAT Project"
                @keyup.enter="createProject"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="isOpen = false">Cancel</Button>
            <Button :disabled="!newProjectName || isCreating" @click="createProject">
              <Loader2 v-if="isCreating" class="mr-2 size-4 animate-spin" />
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Edit Project Dialog -->
    <Dialog v-model:open="isEditOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Rename your project.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="edit-name">Project Name</Label>
            <Input id="edit-name" v-model="editProjectName" @keyup.enter="saveEdit" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isEditOpen = false">Cancel</Button>
          <Button :disabled="!editProjectName.trim() || isUpdating" @click="saveEdit">
            <Loader2 v-if="isUpdating" class="mr-2 size-4 animate-spin" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Project Confirmation -->
    <Dialog v-model:open="isDeleteOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete project?</DialogTitle>
          <DialogDescription>
            This will remove the project. Tasks that belong to it will be kept, but their project
            will be set to “No project”.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteOpen = false">Cancel</Button>
          <Button variant="destructive" :disabled="isDeleting" @click="confirmDelete">
            <Loader2 v-if="isDeleting" class="mr-2 size-4 animate-spin" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="project in projects"
        :key="project.id"
        class="hover:border-primary/50 transition-colors"
      >
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            {{ project.name }}
          </CardTitle>
          <div class="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              class="h-8 w-8"
              @click.stop="openEdit(project.id, project.name)"
            >
              <Pencil class="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              class="text-destructive hover:text-destructive h-8 w-8"
              @click.stop="openDelete(project.id)"
            >
              <Trash2 class="size-4" />
            </Button>
            <FolderKanban class="text-muted-foreground ml-1 size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ getProjectStats(project.id).total }} Tasks</div>
          <div class="mt-4 flex items-center gap-2">
            <div class="bg-muted h-2 flex-1 overflow-hidden rounded-full">
              <div
                class="bg-primary h-full transition-all"
                :style="{ width: `${getProjectStats(project.id).percentage}%` }"
              ></div>
            </div>
            <span class="text-muted-foreground text-xs"
              >{{ getProjectStats(project.id).percentage }}%</span
            >
          </div>
          <div class="mt-4 flex items-center justify-between">
            <span class="text-muted-foreground text-xs"
              >{{ getProjectStats(project.id).completed }} completed</span
            >
            <Badge variant="outline">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <!-- Placeholder if no projects -->
      <Card
        v-if="projects.length === 0"
        class="col-span-full flex items-center justify-center border-dashed p-12"
      >
        <div class="text-center">
          <FolderKanban class="text-muted-foreground mx-auto size-12 opacity-20" />
          <h3 class="mt-4 font-semibold">No projects yet</h3>
          <p class="text-muted-foreground text-sm">Create your first project to get started.</p>
          <Button variant="outline" class="mt-4" @click="isOpen = true">Create Project</Button>
        </div>
      </Card>
    </div>
  </div>
</template>
