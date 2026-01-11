import { useTheme } from "@/composables/useTheme";

export default defineNuxtPlugin(() => {
  const { theme, setTheme } = useTheme();
  // Ensure DOM class is applied on first load (before user navigates)
  setTheme(theme.value);
});

