import { matchJob } from "../lib/matcher.js";
import { loadCv } from "../lib/parser.js";
import {
	type ToolResponse,
	isErrorResponse,
	safeLoadCv,
	textResult,
} from "../lib/response.js";

export async function matchJobHandler(args: {
	description: string;
}): Promise<ToolResponse> {
	const result = safeLoadCv(() => loadCv("en"));
	if (isErrorResponse(result)) return result;

	const match = matchJob(args.description, result);
	const lines: string[] = [];

	lines.push("## Job Fit Analysis for Felipe Bueno");
	lines.push("");
	lines.push(`**Fit Score: ${match.score}/100**`);
	lines.push("");

	if (match.matchedSkills.length === 0 && match.missingSkills.length === 0) {
		lines.push(
			"_Note: No recognizable technology keywords were found in the job description. Try including specific tool, language, or framework names for a more accurate analysis._",
		);
		lines.push("");
	}

	if (match.matchedSkills.length > 0) {
		lines.push(`### Matching Skills (${match.matchedSkills.length})`);
		lines.push(match.matchedSkills.join(", "));
		lines.push("");
	}

	if (match.missingSkills.length > 0) {
		lines.push(`### Gaps (${match.missingSkills.length})`);
		lines.push(match.missingSkills.join(", "));
		lines.push("");
	}

	if (match.relevantExperience.length > 0) {
		lines.push("### Relevant Experience");
		for (const exp of match.relevantExperience) {
			lines.push(`- ${exp}`);
		}
		lines.push("");
	}

	lines.push("### Suggested Pitch");
	lines.push(match.suggestedPitch);

	return textResult(lines.join("\n"));
}
