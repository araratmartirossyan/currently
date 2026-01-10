import { createConfigForNuxt } from "@nuxt/eslint-config";

export default createConfigForNuxt({
  features: {
    // Prettier handles formatting; keep ESLint focused on correctness.
    stylistic: false,
  },
}).override("nuxt/vue/rules", {
  rules: {
    // Keep lint focused on correctness (Prettier handles formatting).
    "vue/attributes-order": "off",
    "vue/html-self-closing": "off",
    "vue/require-default-prop": "off",
  },
});
