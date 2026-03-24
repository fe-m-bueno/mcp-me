import { loadProjects } from "../lib/projects.js";
import type { Project } from "../lib/projects.js";
import {
	type ToolResponse,
	errorResult,
	isErrorResponse,
	safeLoadCv,
	textResult,
} from "../lib/response.js";

function formatProject(project: Project): string {
	const lines: string[] = [];
	const statusLabel =
		project.status === "in-progress"
			? "In Progress"
			: project.status.charAt(0).toUpperCase() + project.status.slice(1);

	lines.push(`### ${project.name} (${statusLabel})`);
	lines.push(`**Stack:** ${project.tech.join(", ")}`);
	lines.push(`**Description:** ${project.description}`);

	if (project.highlights.length > 0) {
		lines.push("**Highlights:**");
		for (const h of project.highlights) {
			lines.push(`- ${h}`);
		}
	}

	if (project.repo) {
		lines.push(`**Repo:** ${project.repo}`);
	} else {
		lines.push("**Repo:** Private");
	}

	if (project.demo) {
		lines.push(`**Demo:** ${project.demo}`);
	}

	return lines.join("\n");
}

export async function listProjectsHandler(args: {
	tech?: string;
}): Promise<ToolResponse> {
	const result = safeLoadCv(() => loadProjects());
	if (isErrorResponse(result)) return result;
	const projects = result;

	let filtered = projects;
	if (args.tech) {
		const query = args.tech.toLowerCase();
		filtered = projects.filter((p) =>
			p.tech.some((t) => t.toLowerCase().includes(query)),
		);
	}

	if (filtered.length === 0) {
		const allTechs = [...new Set(projects.flatMap((p) => p.tech))].sort();
		return errorResult(
			`No projects found matching "${args.tech}".\n\nAvailable technologies: ${allTechs.join(", ")}`,
		);
	}

	const header = args.tech
		? `## Felipe Bueno's Projects (filtered by: ${args.tech})\n\nFound ${filtered.length} project(s):\n`
		: `## Felipe Bueno's Projects\n\n${filtered.length} projects total:\n`;

	const body = filtered.map(formatProject).join("\n\n---\n\n");

	return textResult(`${header}\n${body}`);
}
