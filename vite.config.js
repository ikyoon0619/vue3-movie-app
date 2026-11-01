import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages는 /<저장소 이름>/ 경로로 서비스되므로 배포 시 BASE_PATH로 지정한다.
  base: process.env.BASE_PATH || "/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
