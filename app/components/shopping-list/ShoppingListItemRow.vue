<script setup lang="ts">
import { ref, watch } from "vue";
import { Pencil, Trash2, Check } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useShoppingListStore } from "@/stores/shoppingList";
import type { ShoppingListItem } from "@/types";

const props = defineProps<{
  item: ShoppingListItem;
}>();

const store = useShoppingListStore();

const isEditing = ref(false);
const editText = ref(props.item.text);

watch(
  () => props.item.text,
  (next) => {
    if (!isEditing.value) editText.value = next;
  }
);

function coerceChecked(v: boolean | "indeterminate") {
  return v === true;
}

function onCheckedChange(v: boolean | "indeterminate") {
  store.setChecked(props.item.id, coerceChecked(v));
}

function startEdit() {
  isEditing.value = true;
  editText.value = props.item.text;
}

function saveEdit() {
  store.updateItemText(props.item.id, editText.value);
  isEditing.value = false;
}

function cancelEdit() {
  isEditing.value = false;
  editText.value = props.item.text;
}
</script>

<template>
  <div class="hover:bg-muted/40 flex items-center gap-3 px-5 py-4">
    <Checkbox
      class="cursor-pointer rounded-full"
      :checked="item.checked"
      @update:checked="onCheckedChange"
    />

    <div class="min-w-0 flex-1">
      <div v-if="!isEditing" class="min-w-0">
        <span :class="item.checked ? 'text-muted-foreground line-through' : 'text-foreground'">
          {{ item.text }}
        </span>
      </div>

      <div v-else class="flex items-center gap-2">
        <Input
          v-model="editText"
          class="cursor-text"
          placeholder="Item"
          @keydown.enter.prevent="saveEdit"
          @keydown.esc.prevent="cancelEdit"
        />
      </div>
    </div>

    <Button
      variant="ghost"
      size="icon"
      class="cursor-pointer"
      :title="isEditing ? 'Save' : 'Edit'"
      @click="isEditing ? saveEdit() : startEdit()"
    >
      <Check v-if="isEditing" class="size-4" />
      <Pencil v-else class="size-4" />
    </Button>

    <Button
      variant="ghost"
      size="icon"
      class="cursor-pointer"
      title="Delete"
      @click="store.removeItem(item.id)"
    >
      <Trash2 class="size-4" />
    </Button>
  </div>
</template>

