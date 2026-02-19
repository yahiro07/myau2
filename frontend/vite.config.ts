import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	appType: "mpa",
	plugins: [tailwindcss(), react(), tsconfigPaths()],
	build: {
		outDir: "./www_dev",
	},
	server: {
		port: 3000,
		host: "0.0.0.0",
	},
});
