import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function dataPath(filename: string): string {
	return join(__dirname, "data", filename);
}
