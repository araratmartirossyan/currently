import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import type { ShoppingListItem } from "@/types";

const STORAGE_KEY = "currently_shopping_list_v1";

function safeParseItems(raw: string | null): ShoppingListItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x): ShoppingListItem | null => {
        if (typeof x !== "object" || x === null) return null;
        const r = x as Record<string, unknown>;
        const id = typeof r.id === "string" ? r.id : null;
        const text = typeof r.text === "string" ? r.text : null;
        const checked = typeof r.checked === "boolean" ? r.checked : false;
        const created_at = typeof r.created_at === "string" ? r.created_at : null;
        const checked_at =
          r.checked_at === null ? null : typeof r.checked_at === "string" ? r.checked_at : null;
        if (!id || !text || !created_at) return null;
        return { id, text, checked, created_at, checked_at };
      })
      .filter((x): x is ShoppingListItem => Boolean(x));
  } catch {
    return [];
  }
}

function persistItems(items: ShoppingListItem[]) {
  if (!import.meta.client) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const useShoppingListStore = defineStore("shoppingList", () => {
  const initial = import.meta.client ? safeParseItems(window.localStorage.getItem(STORAGE_KEY)) : [];
  const items = ref<ShoppingListItem[]>(initial);

  const sortedItems = computed<ShoppingListItem[]>(() => {
    const copy = [...items.value];
    copy.sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      // unchecked: newest first; checked: oldest checked first
      if (!a.checked && !b.checked) return b.created_at.localeCompare(a.created_at);
      const aKey = a.checked_at || a.created_at;
      const bKey = b.checked_at || b.created_at;
      return aKey.localeCompare(bKey);
    });
    return copy;
  });

  function addItem(text: string) {
    const clean = text.trim().replace(/\s+/g, " ");
    if (!clean) return;

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const next: ShoppingListItem = {
      id,
      text: clean,
      checked: false,
      created_at: now,
      checked_at: null,
    };

    items.value = [next, ...items.value];
  }

  function toggleItem(id: string) {
    const current = items.value.find((it) => it.id === id);
    if (!current) return;
    setChecked(id, !current.checked);
  }

  function setChecked(id: string, checked: boolean) {
    const now = new Date().toISOString();
    items.value = items.value.map((it) => {
      if (it.id !== id) return it;
      return {
        ...it,
        checked,
        checked_at: checked ? now : null,
      };
    });
  }

  function updateItemText(id: string, text: string) {
    const clean = text.trim().replace(/\s+/g, " ");
    if (!clean) return;
    items.value = items.value.map((it) => (it.id === id ? { ...it, text: clean } : it));
  }

  function removeItem(id: string) {
    items.value = items.value.filter((it) => it.id !== id);
  }

  function clearChecked() {
    items.value = items.value.filter((it) => !it.checked);
  }

  watch(
    items,
    (next) => {
      persistItems(next);
    },
    { deep: true }
  );

  return {
    items,
    sortedItems,
    addItem,
    toggleItem,
    setChecked,
    updateItemText,
    removeItem,
    clearChecked,
  };
});

