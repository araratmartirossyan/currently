<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { computed } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { Check } from "lucide-vue-next";
import { CheckboxIndicator, CheckboxRoot } from "reka-ui";
import { cn } from "@/lib/utils";

type CheckedState = boolean | "indeterminate" | null | undefined;

type Props = {
  class?: HTMLAttributes["class"];
  /**
   * Compatibility alias for consumers using `:checked` and `@update:checked`.
   * Internally mapped to Reka UI's `modelValue` / `update:modelValue`.
   */
  checked?: CheckedState;
  defaultValue?: CheckedState;
  modelValue?: CheckedState;
  disabled?: boolean;
  value?: unknown;
  id?: string;
  asChild?: boolean;
  as?: unknown;
  name?: string;
  required?: boolean;
};

const props = defineProps<Props>();
const emits = defineEmits<{
  (e: "update:modelValue" | "update:checked", value: Exclude<CheckedState, null | undefined>): void;
}>();

const delegatedProps = reactiveOmit(props, "class", "checked", "modelValue");

const modelValue = computed<Exclude<CheckedState, null | undefined> | undefined>(() => {
  if (props.modelValue !== undefined && props.modelValue !== null)
    return props.modelValue as Exclude<CheckedState, null | undefined>;
  if (props.checked !== undefined && props.checked !== null)
    return props.checked as Exclude<CheckedState, null | undefined>;
  return undefined;
});

function onUpdateModelValue(value: Exclude<CheckedState, null | undefined>) {
  emits("update:modelValue", value);
  emits("update:checked", value);
}
</script>

<template>
  <CheckboxRoot
    v-bind="delegatedProps"
    :model-value="modelValue"
    @update:model-value="onUpdateModelValue"
    @click.stop
    @keydown.space.stop
    @keydown.enter.stop
    :class="
      cn(
        'peer border-primary ring-offset-background focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground grid h-4 w-4 shrink-0 cursor-pointer place-content-center rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
  >
    <CheckboxIndicator class="grid place-content-center text-current">
      <slot>
        <Check class="h-4 w-4" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
