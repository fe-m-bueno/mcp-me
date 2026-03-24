import { getSection, getSectionNames, loadCv } from "../lib/parser.js";
import {
	type ToolResponse,
	errorResult,
	isErrorResponse,
	safeLoadCv,
	textResult,
} from "../lib/response.js";

export async function getCvHandler(args: {
	lang?: string;
	section?: string;
}): Promise<ToolResponse> {
	const lang = (args.lang ?? "en") as "en" | "pt-br";
	const result = safeLoadCv(() => loadCv(lang));
	if (isErrorResponse(result)) return result;
	const cv = result;

	const langLabel = lang === "pt-br" ? "Portuguese" : "English";

	if (args.section) {
		const section = getSection(cv, args.section);
		if (section) {
			return textResult(`## ${args.section} (${langLabel})\n\n${section}`);
		}

		const available = getSectionNames(cv);
		return errorResult(
			`Section "${args.section}" not found. Available sections: ${available.join(", ")}.\n\nTip: Use aliases like "summary", "skills", "experience", "projects", "education", "certifications", or "languages".`,
		);
	}

	return textResult(`# Felipe Bueno's CV (${langLabel})\n\n${cv.raw}`);
}
