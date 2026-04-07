import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    outDir:
      "../swiftpm/Auv3PluginPackage/Sources/FrameworkMain/Resources/pages/www-bundles",
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});
