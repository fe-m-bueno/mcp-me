import { readFileSync } from "node:fs";
import { dataPath } from "./paths.js";

export type ProjectStatus =
	| "completed"
	| "in-progress"
	| "active"
	| "experimental";
export type ProjectCategory = "cv" | "additional";

export interface Project {
	name: string;
	description: string;
	tech: string[];
	repo: string | null;
	demo: string | null;
	highlights: string[];
	status: ProjectStatus;
	category: ProjectCategory;
}

let cached: Project[] | null = null;

export function loadProjects(): Project[] {
	if (cached) return cached;

	const raw = JSON.parse(readFileSync(dataPath("projects.json"), "utf-8"));
	if (!Array.isArray(raw)) {
		throw new Error("projects.json must be an array");
	}
	cached = raw as Project[];
	return cached;
}
