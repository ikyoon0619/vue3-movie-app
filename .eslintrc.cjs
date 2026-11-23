/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/eslint-config-prettier",
  ],
  parserOptions: {
    ecmaVersion: "latest",
  },
  overrides: [
    {
      // Netlify Function과 테스트는 브라우저가 아니라 Node에서 실행된다
      files: ["functions/**/*.js", "tests/**/*.js"],
      env: { node: true },
      parserOptions: { sourceType: "module" },
    },
  ],
};
