<script setup lang="ts">
import { computed, ref } from "vue";
import { ListChecks } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShoppingListStore } from "@/stores/shoppingList";
import ShoppingListItemRow from "@/components/shopping-list/ShoppingListItemRow.vue";

const store = useShoppingListStore();

const newItemText = ref("");

const hasChecked = computed(() => store.items.some((i) => i.checked));
const isEmpty = computed(() => store.items.length === 0);

function add() {
  store.addItem(newItemText.value);
  newItemText.value = "";
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Shopping list</h1>
        <p class="text-sm text-muted-foreground">Add items, check them off, and they’ll move down.</p>
      </div>
      <Button
        variant="outline"
        class="cursor-pointer gap-2"
        :disabled="!hasChecked"
        @click="store.clearChecked()"
      >
        <ListChecks class="size-4" />
        Clear checked
      </Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Add item</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col gap-2 sm:flex-row">
          <Input
            v-model="newItemText"
            class="cursor-text"
            placeholder="Milk, eggs, bread…"
            @keydown.enter.prevent="add"
          />
          <Button class="cursor-pointer" @click="add">Add</Button>
        </div>
        <p class="mt-2 text-xs text-muted-foreground">Press Enter to add quickly.</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Items</CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <div v-if="isEmpty" class="p-6 text-sm text-muted-foreground">
          Your shopping list is empty. Add your first item above.
        </div>

        <div v-else class="divide-y">
          <ShoppingListItemRow v-for="item in store.sortedItems" :key="item.id" :item="item" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>

