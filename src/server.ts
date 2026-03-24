import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { askAboutMeHandler } from "./tools/ask.js";
import { getCvHandler } from "./tools/cv.js";
import { matchJobHandler } from "./tools/match.js";
import { listProjectsHandler } from "./tools/projects.js";

const READ_ONLY = {
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false,
} as const;

export function createServer(): McpServer {
	const server = new McpServer({
		name: "mcp-me",
		version: "1.0.0",
	});

	server.registerTool(
		"get_cv",
		{
			title: "Get CV",
			description: `Returns Felipe Bueno's CV — full document or a specific named section.

Use this tool when you need biographical, career, or skills information. For targeted keyword searches across all sections, use ask_about_me instead. For structured project data with links, use list_projects instead.

Sections available (use the alias or the full heading name):
- summary / "Professional Summary"
- skills / "Technical Skills"
- experience / "Professional Experience"
- projects / "Projects"
- education / "Education"
- certifications / "Certifications & Continuous Learning"
- languages / "Languages"

Returns the full CV when no section is specified. Section matching is case-insensitive and supports partial matches.

Error cases:
- If section is not found, returns the list of available sections with isError: true.`,
			inputSchema: {
				lang: z
					.enum(["en", "pt-br"])
					.optional()
					.describe(
						"Language: 'en' for English (default), 'pt-br' for Portuguese",
					),
				section: z
					.string()
					.optional()
					.describe(
						"Section to retrieve: summary, skills, experience, projects, education, certifications, languages",
					),
			},
			annotations: READ_ONLY,
		},
		getCvHandler,
	);

	server.registerTool(
		"list_projects",
		{
			title: "List Projects",
			description: `Lists Felipe Bueno's projects with full metadata: description, tech stack, highlights, repo URL, demo URL, and status.

Use this when you need project details, links, or want to filter by technology. For broader keyword search across the whole profile including CV experience, use ask_about_me instead.

The tech filter is case-insensitive and supports partial matches (e.g., "next" matches "Next.js").

Status values: "completed", "in-progress", "active", "experimental".
Projects are categorized as "cv" (featured in resume) or "additional" (GitHub extras).

Error cases:
- If no projects match the filter, returns the full list of available technologies with isError: true.`,
			inputSchema: {
				tech: z
					.string()
					.optional()
					.describe("Filter by technology, e.g. 'Next.js', 'Python', 'Svelte'"),
			},
			annotations: READ_ONLY,
		},
		listProjectsHandler,
	);

	server.registerTool(
		"match_job",
		{
			title: "Match Job",
			description: `Analyzes how well Felipe Bueno's profile fits a job description. Returns matched skills, real gaps, a fit score (0-100), relevant experience excerpts, and a suggested pitch.

Provide the full job description or a list of requirements. The more detail in the input, the more accurate the analysis.

Output fields:
- Fit Score (0-100): percentage of required tech skills present in his stack, plus a bonus for relevant experience
- Matching Skills: tech skills from his CV that appear in the job description
- Gaps: tech required by the job not present in his CV
- Relevant Experience: specific bullet points from his work history that overlap with the role
- Suggested Pitch: honest assessment calibrated to the score

Honesty note: gaps are reported as real gaps, not softened. A score below 40 means a significant career pivot.`,
			inputSchema: {
				description: z
					.string()
					.min(10, "Job description must be at least 10 characters")
					.describe(
						"The full job description or list of requirements to match against",
					),
			},
			annotations: READ_ONLY,
		},
		matchJobHandler,
	);

	server.registerTool(
		"ask_about_me",
		{
			title: "Ask About Me",
			description: `Searches across Felipe Bueno's full profile (CV sections + all projects) using keyword matching and returns the most relevant excerpts.

Use this for specific factual questions: "does he have ETL experience?", "what databases has he used?", "tem experiência com IA?". Supports English and Portuguese keywords.

For the full CV text, use get_cv instead. For structured project data with links, use list_projects instead.

The search scores paragraphs and project entries by keyword matches, then returns the top 10 results grouped by section.

Error cases:
- If all words are too generic (stop words), asks for more specific keywords.
- If no matches found, suggests trying specific technology names or roles.`,
			inputSchema: {
				question: z
					.string()
					.describe(
						"A question or keyword to search across Felipe's experience, e.g. 'ETL experience', 'database optimization', 'tem experiência com IA?'",
					),
			},
			annotations: READ_ONLY,
		},
		askAboutMeHandler,
	);

	return server;
}
