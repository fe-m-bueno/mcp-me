import { type CvData, getSection } from "./parser.js";

export interface MatchResult {
	score: number;
	matchedSkills: string[];
	missingSkills: string[];
	relevantExperience: string[];
	suggestedPitch: string;
}

const TECH_KEYWORDS = [
	"javascript",
	"typescript",
	"python",
	"java",
	"c#",
	"csharp",
	"c++",
	"go",
	"golang",
	"rust",
	"ruby",
	"php",
	"swift",
	"kotlin",
	"scala",
	"r",
	"sql",
	"html",
	"html5",
	"css",
	"css3",
	"sass",
	"less",
	"react",
	"react.js",
	"reactjs",
	"next.js",
	"nextjs",
	"angular",
	"vue",
	"vue.js",
	"vuejs",
	"nuxt",
	"nuxt.js",
	"svelte",
	"sveltekit",
	"tailwind",
	"tailwindcss",
	"bootstrap",
	"material-ui",
	"chakra",
	"radix",
	"node",
	"node.js",
	"nodejs",
	"express",
	"express.js",
	"fastify",
	"nest.js",
	"nestjs",
	"django",
	"flask",
	"fastapi",
	"spring",
	"spring boot",
	".net",
	"dotnet",
	"asp.net",
	"rails",
	"laravel",
	"graphql",
	"rest",
	"grpc",
	"postgresql",
	"postgres",
	"mysql",
	"mongodb",
	"redis",
	"sqlite",
	"sql server",
	"dynamodb",
	"cassandra",
	"elasticsearch",
	"neo4j",
	"supabase",
	"firebase",
	"prisma",
	"drizzle",
	"sequelize",
	"typeorm",
	"docker",
	"kubernetes",
	"k8s",
	"terraform",
	"ansible",
	"aws",
	"azure",
	"gcp",
	"google cloud",
	"vercel",
	"netlify",
	"heroku",
	"railway",
	"ci/cd",
	"github actions",
	"jenkins",
	"gitlab ci",
	"git",
	"linux",
	"nginx",
	"apache",
	"airflow",
	"apache airflow",
	"kafka",
	"rabbitmq",
	"celery",
	"langchain",
	"crewai",
	"openai",
	"llm",
	"mcp",
	"selenium",
	"playwright",
	"cypress",
	"jest",
	"vitest",
	"mocha",
	"pytest",
	"power bi",
	"metabase",
	"grafana",
	"figma",
	"storybook",
	"webpack",
	"vite",
	"esbuild",
	"tsup",
	"babel",
	"eslint",
	"biome",
	"prettier",
	"sharp",
	"ffmpeg",
	"oauth",
	"oauth2",
	"jwt",
	"sso",
	"saml",
	"etl",
	"data pipeline",
	"web scraping",
	"websocket",
	"sse",
	"i18n",
	"seo",
	"accessibility",
	"a11y",
	"agile",
	"scrum",
	"kanban",
	"microservices",
	"monorepo",
	"api",
	"sdk",
	"cli",
	"orm",
	"rls",
	"sap",
] as const;

// Precompiled regex patterns for tech keyword matching
const TECH_PATTERNS = TECH_KEYWORDS.map((tech) => ({
	keyword: tech,
	pattern: new RegExp(
		`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
		"i",
	),
}));

function extractCvSkills(cv: CvData): string[] {
	const skillsSection = getSection(cv, "skills");
	if (!skillsSection) return [];

	const skills: string[] = [];
	for (const line of skillsSection.split("\n")) {
		const match = line.match(/\*\*[^*]+\*\*[:\s]*(.*)/);
		if (match) {
			const items = match[1].split(",").map((s) => s.trim());
			skills.push(...items.filter(Boolean));
		}
	}
	return skills;
}

function normalizeSkill(skill: string): string {
	return skill
		.toLowerCase()
		.replace(/[.\-/]/g, "")
		.replace(/\s+/g, " ");
}

// Only match if the shorter string is a meaningful portion of the longer,
// preventing false positives like "kubernetes" matching ".NET" (via "net")
function skillsMatch(a: string, b: string): boolean {
	const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
	if (shorter.length < 3) return false;
	if (!longer.includes(shorter)) return false;
	return shorter.length / longer.length >= 0.5;
}

function extractTechFromDescription(description: string): string[] {
	const descLower = description.toLowerCase();
	const found: string[] = [];

	for (const { keyword, pattern } of TECH_PATTERNS) {
		if (pattern.test(descLower)) {
			found.push(keyword);
		}
	}

	return found;
}

function extractExperienceBullets(cv: CvData): string[] {
	const experienceSection = getSection(cv, "experience");
	if (!experienceSection) return [];

	return experienceSection
		.split("\n")
		.filter((line) => line.trim().startsWith("- "))
		.map((line) => line.trim().replace(/^- /, ""));
}

export function matchJob(jobDescription: string, cv: CvData): MatchResult {
	const cvSkills = extractCvSkills(cv);
	const cvSkillsNormalized = new Map(
		cvSkills.map((s) => [normalizeSkill(s), s]),
	);
	const jobTechKeywords = extractTechFromDescription(jobDescription);

	const matchedSet = new Set<string>();
	const matchedSkills: string[] = [];
	const missingSkills: string[] = [];

	for (const tech of jobTechKeywords) {
		const techNorm = normalizeSkill(tech);
		let found = false;

		for (const [cvNorm, cvOriginal] of cvSkillsNormalized) {
			if (cvNorm === techNorm || skillsMatch(cvNorm, techNorm)) {
				if (!matchedSet.has(cvOriginal)) {
					matchedSet.add(cvOriginal);
					matchedSkills.push(cvOriginal);
				}
				found = true;
				break;
			}
		}

		if (!found) {
			missingSkills.push(tech);
		}
	}

	const bullets = extractExperienceBullets(cv);
	const descWords = jobDescription
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 3);

	const relevantExperience = bullets
		.map((bullet) => {
			const bulletLower = bullet.toLowerCase();
			const relevance = descWords.filter((w) => bulletLower.includes(w)).length;
			return { bullet, relevance };
		})
		.filter((b) => b.relevance >= 2)
		.sort((a, b) => b.relevance - a.relevance)
		.slice(0, 5)
		.map((b) => b.bullet);

	const totalTech = matchedSkills.length + missingSkills.length;
	let score = totalTech > 0 ? (matchedSkills.length / totalTech) * 100 : 0;
	score += Math.min(relevantExperience.length * 2, 10);
	score = Math.min(Math.round(score), 100);

	const suggestedPitch = generatePitch(
		cv.header.name,
		matchedSkills,
		missingSkills,
		relevantExperience,
		score,
	);

	return {
		score,
		matchedSkills,
		missingSkills,
		relevantExperience,
		suggestedPitch,
	};
}

function generatePitch(
	name: string,
	matched: string[],
	missing: string[],
	experience: string[],
	score: number,
): string {
	if (score >= 70) {
		const topSkills = matched.slice(0, 5).join(", ");
		let pitch = `${name} is a strong fit for this role, bringing hands-on experience with ${topSkills}.`;
		if (experience.length > 0) {
			pitch +=
				" His professional background directly demonstrates relevant work in this domain.";
		}
		if (missing.length > 0) {
			pitch += ` While ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not currently in his stack, his track record of quickly adopting new technologies makes this a manageable gap.`;
		}
		return pitch;
	}

	if (score >= 40) {
		const topSkills = matched.slice(0, 3).join(", ");
		return `${name} has partial alignment with this role through ${topSkills}, but significant gaps exist in ${missing.slice(0, 3).join(", ")}. This could work as a growth opportunity, but the role may require ramp-up time in the missing areas.`;
	}

	return `${name} has limited overlap with this role's requirements. The main gaps are ${missing.slice(0, 5).join(", ")}. This would represent a significant career pivot rather than a natural next step.`;
}
