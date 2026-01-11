export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser();

  // Public routes:
  // - calendar: read-only agenda for visitors
  // - login: sign in as owner
  if (to.path === "/calendar" || to.path === "/login") return;

  if (!user.value) return navigateTo("/login");
});
