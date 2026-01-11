export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "currently_theme";

function applyThemeToDom(theme: ThemeMode) {
  if (!import.meta.client) return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

function readThemeFromStorage(): ThemeMode {
  if (!import.meta.client) return "light";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "dark" ? "dark" : "light";
}

function writeThemeToStorage(theme: ThemeMode) {
  if (!import.meta.client) return;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function useTheme() {
  const theme = useState<ThemeMode>("themeMode", () => readThemeFromStorage());

  function setTheme(next: ThemeMode) {
    theme.value = next;
    writeThemeToStorage(next);
    applyThemeToDom(next);
  }

  return { theme, setTheme };
}

