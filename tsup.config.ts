import { cp } from "node:fs/promises";
import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	target: "node22",
	clean: true,
	sourcemap: true,
	async onSuccess() {
		await cp("src/data", "dist/data", { recursive: true });
	},
});
