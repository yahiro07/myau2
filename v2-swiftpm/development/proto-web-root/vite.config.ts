import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      react: fileURLToPath(
        new URL("../../frontend/node_modules/react", import.meta.url),
      ),
      "react-dom": fileURLToPath(
        new URL("../../frontend/node_modules/react-dom", import.meta.url),
      ),
      "react-dom/client": fileURLToPath(
        new URL(
          "../../frontend/node_modules/react-dom/client.js",
          import.meta.url,
        ),
      ),
    },
    dedupe: ["react", "react-dom"],
    tsconfigPaths: true,
  },
  server: {
    port: 3000,
  },
});
