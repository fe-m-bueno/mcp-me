import { readFileSync } from "node:fs";
import { loadCv } from "../lib/parser.js";
import { dataPath } from "../lib/paths.js";
import { loadProjects } from "../lib/projects.js";
import {
	type ToolResponse,
	errorResult,
	isErrorResponse,
	safeLoadCv,
	textResult,
} from "../lib/response.js";

function loadExtraFile(filename: string): Array<{ section: string; text: string }> {
	try {
		const raw = readFileSync(dataPath(filename), "utf-8");
		const results: Array<{ section: string; text: string }> = [];
		let currentSection = filename.replace(".md", "");
		for (const line of raw.split("\n")) {
			if (line.startsWith("## ")) {
				currentSection = line.replace(/^## /, "").trim();
			} else if (line.trim().length > 20) {
				results.push({ section: currentSection, text: line.trim() });
			}
		}
		return results;
	} catch {
		return [];
	}
}

const STOP_WORDS = new Set([
	"a",
	"an",
	"the",
	"is",
	"are",
	"was",
	"were",
	"be",
	"been",
	"being",
	"have",
	"has",
	"had",
	"do",
	"does",
	"did",
	"will",
	"would",
	"could",
	"should",
	"may",
	"might",
	"can",
	"shall",
	"to",
	"of",
	"in",
	"for",
	"on",
	"with",
	"at",
	"by",
	"from",
	"as",
	"into",
	"about",
	"like",
	"through",
	"after",
	"over",
	"between",
	"out",
	"against",
	"during",
	"without",
	"before",
	"under",
	"around",
	"among",
	"and",
	"but",
	"or",
	"nor",
	"not",
	"so",
	"yet",
	"both",
	"either",
	"neither",
	"each",
	"every",
	"all",
	"any",
	"few",
	"more",
	"most",
	"other",
	"some",
	"such",
	"no",
	"only",
	"own",
	"same",
	"than",
	"too",
	"very",
	"just",
	"because",
	"if",
	"when",
	"what",
	"which",
	"who",
	"whom",
	"how",
	"where",
	"why",
	"this",
	"that",
	"these",
	"those",
	"it",
	"its",
	"he",
	"him",
	"his",
	"her",
	"she",
	"they",
	"them",
	"their",
	"we",
	"us",
	"our",
	"you",
	"your",
	"i",
	"me",
	"my",
	"tell",
	"know",
	"experience",
	"work",
	"worked",
	"working",
	"does",
	"felipe",
	"bueno",
	"ele",
	"tem",
	"com",
	"que",
	"uma",
	"um",
	"para",
	"por",
	"não",
	"sim",
	"mais",
	"como",
	"sobre",
	"qual",
	"quais",
	"onde",
	"quando",
]);

interface SearchResult {
	section: string;
	text: string;
	score: number;
}

function extractKeywords(question: string): string[] {
	return question
		.toLowerCase()
		.replace(/[?!.,;:'"()[\]{}]/g, "")
		.split(/\s+/)
		.filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

export async function askAboutMeHandler(args: {
	question: string;
}): Promise<ToolResponse> {
	const keywords = extractKeywords(args.question);
	if (keywords.length === 0) {
		return errorResult(
			"Please provide a more specific question with keywords I can search for.",
		);
	}

	const cvResult = safeLoadCv(() => loadCv("en"));
	if (isErrorResponse(cvResult)) return cvResult;
	const cv = cvResult;

	const results: SearchResult[] = [];

	for (const [section, content] of cv.sections) {
		const paragraphs = content.split("\n").filter((l) => l.trim());
		for (const paragraph of paragraphs) {
			const paraLower = paragraph.toLowerCase();
			const matchCount = keywords.filter((kw) => paraLower.includes(kw)).length;
			if (matchCount > 0) {
				results.push({
					section,
					text: paragraph.replace(/^[#\-*\s]+/, "").trim(),
					score: matchCount,
				});
			}
		}
	}

	// Search interview stories and positioning files
	for (const filename of ["interview-stories.md", "positioning.md"]) {
		for (const { section, text } of loadExtraFile(filename)) {
			const textLower = text.toLowerCase();
			const matchCount = keywords.filter((kw) => textLower.includes(kw)).length;
			if (matchCount > 0) {
				results.push({
					section,
					text: text.replace(/^[#\-*\s]+/, "").trim(),
					score: matchCount,
				});
			}
		}
	}

	const projects = loadProjects();
	for (const project of projects) {
		const searchText =
			`${project.name} ${project.description} ${project.tech.join(" ")} ${project.highlights.join(" ")}`.toLowerCase();
		const matchCount = keywords.filter((kw) => searchText.includes(kw)).length;
		if (matchCount > 0) {
			const highlights =
				project.highlights.length > 0
					? ` — ${project.highlights.slice(0, 3).join("; ")}`
					: "";
			results.push({
				section: "Projects",
				text: `**${project.name}** (${project.tech.join(", ")})${highlights}`,
				score: matchCount,
			});
		}
	}

	results.sort((a, b) => b.score - a.score);
	const topResults = results.slice(0, 10);

	if (topResults.length === 0) {
		return textResult(
			`I couldn't find specific information about "${args.question}" in Felipe's profile. Try asking about specific technologies, roles, or project types.`,
		);
	}

	const grouped = new Map<string, string[]>();
	for (const result of topResults) {
		const existing = grouped.get(result.section) ?? [];
		existing.push(result.text);
		grouped.set(result.section, existing);
	}

	const lines: string[] = [];
	lines.push(
		`Based on the question "${args.question}", here are relevant details about Felipe:\n`,
	);

	for (const [section, texts] of grouped) {
		lines.push(`**From ${section}:**`);
		for (const text of texts) {
			lines.push(`- ${text}`);
		}
		lines.push("");
	}

	return textResult(lines.join("\n"));
}
