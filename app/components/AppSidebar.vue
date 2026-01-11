<script setup lang="ts">
import {
  BadgeCheck,
  CalendarDays,
  ChevronsUpDown,
  FolderKanban,
  GalleryVerticalEnd,
  ListTodo,
  LogOut,
  Settings,
} from "lucide-vue-next";
import { computed } from "vue";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "vue-sonner";
import { useSidebar } from "@/components/ui/sidebar/utils";

const { setOpen } = useSidebar();

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const navMain = computed(() => {
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
      isActive: true,
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

const team = {
  name: "Currently",
  logo: GalleryVerticalEnd,
  plan: user.value ? "Owner" : "Public",
};

const handleLinkClick = () => {
  setOpen(false);
};

const handleLogout = async () => {
  setOpen(false);
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
  <Sidebar collapsible="offcanvas">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div
                  class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                >
                  <component :is="team.logo" class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ team.name }}</span>
                  <span class="truncate text-xs">{{ team.plan }}</span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem v-for="item in navMain" :key="item.title">
            <SidebarMenuButton as-child :tooltip="item.title">
              <NuxtLink :to="item.url" @click="handleLinkClick">
                <component :is="item.icon" />
                <span>{{ item.title }}</span>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu v-if="user">
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar class="h-8 w-8 rounded-lg">
                  <AvatarImage :src="avatarUrl" :alt="displayName" />
                  <AvatarFallback class="rounded-lg">{{
                    displayName.slice(0, 2).toUpperCase()
                  }}</AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ displayName }}</span>
                  <span class="truncate text-xs">{{ displayEmail }}</span>
                </div>
                <ChevronsUpDown class="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="bottom"
              align="end"
              :side-offset="4"
            >
              <DropdownMenuLabel class="p-0 font-normal">
                <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar class="h-8 w-8 rounded-lg">
                    <AvatarImage :src="avatarUrl" :alt="displayName" />
                    <AvatarFallback class="rounded-lg">{{
                      displayName.slice(0, 2).toUpperCase()
                    }}</AvatarFallback>
                  </Avatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{ displayName }}</span>
                    <span class="truncate text-xs">{{ displayEmail }}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem as-child @click="handleLinkClick">
                  <NuxtLink to="/settings" class="flex w-full items-center">
                    <BadgeCheck class="mr-2 size-4" />
                    Account
                  </NuxtLink>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="text-destructive focus:bg-destructive/10 focus:text-destructive"
                @click="handleLogout"
              >
                <LogOut class="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <SidebarMenuButton v-else as-child size="lg">
            <NuxtLink to="/login" class="cursor-pointer" @click="handleLinkClick">
              <span class="font-semibold">Sign in</span>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
