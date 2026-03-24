import { readFileSync } from "node:fs";
import { dataPath } from "./paths.js";

export interface CvHeader {
	name: string;
	title: string;
	contact: string;
	links: string;
}

export interface CvData {
	raw: string;
	header: CvHeader;
	sections: Map<string, string>;
}

const SECTION_ALIASES: Record<string, string[]> = {
	summary: ["Professional Summary", "Resumo Profissional"],
	skills: ["Technical Skills", "Competências Técnicas"],
	experience: ["Professional Experience", "Experiência Profissional"],
	projects: ["Projects", "Projetos"],
	education: ["Education", "Formação Acadêmica"],
	certifications: [
		"Certifications & Continuous Learning",
		"Certificações & Aprendizado Contínuo",
	],
	languages: ["Languages", "Idiomas"],
};

export function parseCv(markdown: string): CvData {
	const lines = markdown.split("\n");
	const header: CvHeader = { name: "", title: "", contact: "", links: "" };
	const sections = new Map<string, string>();

	let i = 0;

	// Parse H1 — name
	while (i < lines.length && !lines[i].startsWith("# ")) i++;
	if (i < lines.length) {
		header.name = lines[i].replace(/^# /, "").trim();
		i++;
	}

	// Parse header lines before first ---
	const headerLines: string[] = [];
	while (i < lines.length && lines[i].trim() !== "---") {
		const line = lines[i].trim();
		if (line) headerLines.push(line);
		i++;
	}

	if (headerLines.length >= 1)
		header.title = headerLines[0].replace(/\*\*/g, "").trim();
	if (headerLines.length >= 2) header.contact = headerLines[1];
	if (headerLines.length >= 3) header.links = headerLines[2];

	// Parse sections by H2 headings
	let currentSection = "";
	let currentContent: string[] = [];

	for (; i < lines.length; i++) {
		const line = lines[i];
		if (line.startsWith("## ")) {
			if (currentSection) {
				sections.set(currentSection, currentContent.join("\n").trim());
			}
			currentSection = line.replace(/^## /, "").trim();
			currentContent = [];
		} else if (currentSection) {
			currentContent.push(line);
		}
	}

	if (currentSection) {
		sections.set(currentSection, currentContent.join("\n").trim());
	}

	return { raw: markdown, header, sections };
}

export function getSection(cv: CvData, query: string): string | null {
	// Direct match
	const direct = cv.sections.get(query);
	if (direct) return direct;

	// Case-insensitive match
	const queryLower = query.toLowerCase();
	for (const [key, value] of cv.sections) {
		if (key.toLowerCase() === queryLower) return value;
	}

	// Partial match
	for (const [key, value] of cv.sections) {
		if (key.toLowerCase().includes(queryLower)) return value;
	}

	// Alias match
	const aliases = SECTION_ALIASES[queryLower];
	if (aliases) {
		for (const alias of aliases) {
			const section = cv.sections.get(alias);
			if (section) return section;
		}
	}

	return null;
}

export function getSectionNames(cv: CvData): string[] {
	return Array.from(cv.sections.keys());
}

const cvCache = new Map<string, CvData>();

export function loadCv(lang: "en" | "pt-br"): CvData {
	const cached = cvCache.get(lang);
	if (cached) return cached;

	const filename = lang === "pt-br" ? "cv-ptbr.md" : "cv-en.md";
	const cv = parseCv(readFileSync(dataPath(filename), "utf-8"));
	cvCache.set(lang, cv);
	return cv;
}
