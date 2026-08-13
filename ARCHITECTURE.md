# mcp-me Architecture

Detailed technical documentation on the architecture, module design, data flows, and design decisions.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     MCP Client (LLM/Agent)                      │
│                    (Claude, Cline, etc.)                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                   stdio (JSON-RPC)
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    mcp-me Server                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ src/index.ts: Entry point + stdio transport             │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ src/server.ts: MCP Server registration                  │  │
│  │   - registerTool("get_cv", ...)                         │  │
│  │   - registerTool("list_projects", ...)                  │  │
│  │   - registerTool("match_job", ...)                      │  │
│  │   - registerTool("ask_about_me", ...)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌─────────────┬─────────────┬──────────────┬──────────────┐   │
│  │  cv.ts      │projects.ts  │ match.ts     │  ask.ts      │   │
│  │ (handler)   │ (handler)   │ (handler)    │ (handler)    │   │
│  └─────────────┴─────────────┴──────────────┴──────────────┘   │
│  ┌─────────────┬─────────────┬──────────────┬──────────────┐   │
│  │ parser.ts   │matcher.ts   │projects.ts   │response.ts   │   │
│  │ (CV parse)  │(job matching)│(load projects)│(formatting) │   │
│  └─────────────┴─────────────┴──────────────┴──────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼────┐    ┌───▼────┐    ┌───▼─────┐
    │cv-en.md│    │cv-ptbr.│    │projects.│
    │(file)  │    │(file)  │    │json(file)
    └────────┘    └────────┘    └─────────┘
```

## Modules and Responsibilities

### 1. **src/index.ts** — Entry Point

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
```

**Responsibilities:**
- Initializes the MCP server
- Sets up the stdio transport (stdin/stdout)
- Connects the server to the client via JSON-RPC

**Flow:**
1. Node.js starts the process
2. StdioServerTransport attaches to the parent process's stdio channels
3. Any fatal error is caught and reported on stderr

---

### 2. **src/server.ts** — MCP Server & Tool Registry

Defines the 4 MCP tools with their descriptions, input schemas, and handlers.

```typescript
export function createServer(): McpServer {
  const server = new McpServer({
    name: "mcp-me",
    version: "1.0.0",
  });

  server.registerTool("get_cv", { ... }, getCvHandler);
  server.registerTool("list_projects", { ... }, listProjectsHandler);
  server.registerTool("match_job", { ... }, matchJobHandler);
  server.registerTool("ask_about_me", { ... }, askAboutMeHandler);

  return server;
}
```

**Responsibilities:**
- Define each tool's input schema with Zod
- Define the title and description for client discovery
- Register each tool's handler (callback)
- Mark the tools as read-only with hints

**Safety hints (READ_ONLY):**
```typescript
const READ_ONLY = {
  readOnlyHint: true,        // Does not modify state
  destructiveHint: false,    // Does not delete data
  idempotentHint: true,      // Always returns the same result
  openWorldHint: false,      // Does not require open access
};
```

---

### 3. **src/tools/** — Handlers

#### **cv.ts** — get_cv Handler

```typescript
export async function getCvHandler(args: {
  lang?: string;
  section?: string;
}): Promise<ToolResponse>
```

**Flow:**
1. Validates the language (default: "en")
2. Loads the CV via `loadCv(lang)`
3. If `section` is set:
   - Looks the section up via `getSection(cv, section)`
   - Returns the section, or a list of available sections if not found
4. Otherwise, returns the full CV

**Section matching:**
1. Exact match
2. Case-insensitive match
3. Partial match (substring)
4. Alias match (for example, "skills" → "Technical Skills")

---

#### **projects.ts** — list_projects Handler

```typescript
export async function listProjectsHandler(args: {
  tech?: string;
}): Promise<ToolResponse>
```

**Flow:**
1. Loads the projects via `loadProjects()`
2. If `tech` is set, filters by a case-insensitive match
3. Formats each project with the `formatProject()` helper
4. Returns the list, or an error listing the available technologies

**Formatting:**
```
### Project Name (Status)
**Stack:** Tech1, Tech2, Tech3
**Description:** Description
**Highlights:**
- Point 1
- Point 2
**Repo:** URL or "Private"
**Demo:** URL (if any)
```

---

#### **match.ts** — match_job Handler

```typescript
export async function matchJobHandler(args: {
  description: string;
}): Promise<ToolResponse>
```

**Flow:**
1. Loads the English CV
2. Calls `matchJob(description, cv)` in `lib/matcher.ts`
3. Formats the structured result into sections:
   - Fit Score
   - Matching Skills
   - Gaps
   - Relevant Experience
   - Suggested Pitch

---

#### **ask.ts** — ask_about_me Handler

```typescript
export async function askAboutMeHandler(args: {
  question: string;
}): Promise<ToolResponse>
```

**Flow:**
1. Extracts keywords from the question via `extractKeywords()`
2. Filters out stop words (common, generic)
3. Searches for matches in the CV's sections
4. Searches for matches in the projects
5. Sorts by relevance (keyword match count)
6. Groups by section and returns the top 10

---

### 4. **src/lib/parser.ts** — CV Parser

Turns Markdown into a navigable structure.

```typescript
export interface CvData {
  raw: string;                    // The original Markdown
  header: CvHeader;               // Name, title, contact
  sections: Map<string, string>;  // H2 sections with their content
}
```

**Parsing algorithm:**
1. Splits the Markdown into lines
2. Finds the H1 (`# Name`)
3. Extracts the header lines before the first `---`
4. Iterates the lines after `---`, grouping by H2 (`## Section`)
5. Stores the sections in a Map for O(1) lookup

**Alias system:**
```typescript
const SECTION_ALIASES: Record<string, string[]> = {
  summary: ["Professional Summary", "Resumo Profissional"],
  skills: ["Technical Skills", "Competências Técnicas"],
  // ...
};
```

This lets you search for "summary" and find "Professional Summary" or "Resumo Profissional".

**Cache:**
```typescript
const cvCache = new Map<string, CvData>();

export function loadCv(lang: "en" | "pt-br"): CvData {
  const cached = cvCache.get(lang);
  if (cached) return cached;
  // loads from disk only the first time
  const cv = parseCv(readFileSync(...));
  cvCache.set(lang, cv);
  return cv;
}
```

---

### 5. **src/lib/matcher.ts** — Job Matching Engine

Analyzes the fit between a role and the profile.

```typescript
export interface MatchResult {
  score: number;                   // 0-100
  matchedSkills: string[];         // Skills present on both sides
  missingSkills: string[];         // Skills in the role, not in the CV
  relevantExperience: string[];    // Aligned experience
  suggestedPitch: string;          // A pitch calibrated to the score
}

export function matchJob(jobDescription: string, cv: CvData): MatchResult
```

**Components:**

#### **Tech Keywords Registry**
170+ pre-compiled tech keywords:
- Languages: JavaScript, Python, Java, Go, Rust, and so on
- Frameworks: React, Vue, Angular, Next.js, Django, FastAPI, and so on
- Databases: PostgreSQL, MongoDB, Redis, DynamoDB, and so on
- DevOps: Docker, Kubernetes, Terraform, AWS, and so on
- Others: GraphQL, REST, CI/CD, MCP, ETL, and so on

Each keyword has a pre-compiled regex for fast matching.

#### **extractCvSkills(cv)**
Parses the "Technical Skills" section and extracts skills formatted as:
```markdown
**Frontend:** React, TypeScript, Tailwind CSS
**Backend:** Node.js, FastAPI, PostgreSQL
```

Result: `["React", "TypeScript", "Tailwind CSS", "Node.js", ...]`

#### **normalizeSkill(skill)**
Normalizes a skill for matching:
- Lowercase
- Strips periods, hyphens, and slashes
- Normalizes whitespace

Example: "Next.js" → "nextjs", "C#" → "c", "C++" → "c"

#### **skillsMatch(a, b)**
Checks whether two skills are equivalent, with protection against false positives:
- Requires a minimum length (3 characters)
- Substring matching with a 50% threshold

This prevents the "NET" from "ASP.NET" matching "Kubernetes".

#### **extractTechFromDescription(description)**
Finds every tech keyword in the job description using the pre-compiled regexes.

#### **extractExperienceBullets(cv)**
Extracts bullet points from the "Professional Experience" section:
```markdown
- Built a chat system with SSE and Redis
- Mentored 3 engineers on the Node.js stack
```

#### **Scoring Algorithm**

```typescript
// Phase 1: skill matching
for (const tech of jobTechKeywords) {
  // Look it up in cvSkills, with normalization
  if (found) {
    matchedSkills.push(tech);
  } else {
    missingSkills.push(tech);
  }
}

// Phase 2: extracting relevant experience
const relevantExperience = extractExperienceBullets(cv)
  .map(bullet => ({
    bullet,
    relevance: count_job_words_in_bullet(bullet)
  }))
  .filter(b => relevance >= 2)  // At least 2 word matches
  .sort((a, b) => b.relevance - a.relevance)
  .slice(0, 5);  // Top 5

// Phase 3: score calculation
let score = (matchedSkills.length / totalTechKeywords) * 100;
score += Math.min(relevantExperience.length * 2, 10);  // Bonus of up to 10 points
score = Math.min(Math.round(score), 100);
```

#### **Pitch Generation**

Score >= 70 (Strong fit):
```
"[Name] is a strong fit for this role, bringing hands-on experience with [skills].
His professional background directly demonstrates relevant work in this domain.
While [missing] are not in his stack, his track record of quickly adopting new
technologies makes this a manageable gap."
```

Score 40-69 (Partial fit):
```
"[Name] has partial alignment with this role through [skills], but significant
gaps exist in [missing]. This could work as a growth opportunity, but the role
may require ramp-up time in the missing areas."
```

Score < 40 (Poor fit):
```
"[Name] has limited overlap with this role's requirements. The main gaps are
[missing]. This would represent a significant career pivot rather than a natural
next step."
```

---

### 6. **src/lib/projects.ts** — Project Loader

```typescript
export interface Project {
  name: string;
  description: string;
  tech: string[];
  repo: string | null;
  demo: string | null;
  highlights: string[];
  status: "completed" | "in-progress" | "active" | "experimental";
  category: "cv" | "additional";
}

export function loadProjects(): Project[]
```

**Responsibilities:**
- Loads `projects.json` from disk
- Validates that it is an array
- Caches it in memory

There is no strict Zod validation; it trusts the file's structure.

---

### 7. **src/lib/response.ts** — Response Formatting

```typescript
export interface ToolResponse {
  isError?: boolean;
  content: Array<{ type: "text"; text: string }>;
}

export function textResult(text: string): ToolResponse
export function errorResult(text: string): ToolResponse
export function safeLoadCv<T>(loader: () => T): T | ToolResponse
export function isErrorResponse(value: unknown): value is ToolResponse
```

**Pattern:**
- Success: `{ content: [{ type: "text", text: "..." }] }`
- Error: `{ isError: true, content: [{ type: "text", text: "..." }] }`

**safeLoadCv** for defensive loading:
```typescript
const result = safeLoadCv(() => loadCv("en"));
if (isErrorResponse(result)) return result;
const cv = result;  // guaranteed to be CvData
```

---

### 8. **src/lib/paths.ts** — Path Resolution

```typescript
export function dataPath(filename: string): string {
  return join(__dirname, "data", filename);
}
```

Resolves to `src/data/` at build time and `dist/data/` at runtime.

Uses `import.meta.url` for ES Modules.

---

### 9. **src/data/** — Data Files

#### **cv-en.md / cv-ptbr.md**
Markdown with this structure:
```markdown
# Felipe Bueno
**Senior Software Engineer** | São Paulo, Brazil | [email] [links]

---

## Professional Summary
...

## Technical Skills
...

## Professional Experience
...

## Projects
...

## Education
...

## Languages
...
```

Synced from the `~/Development/cv/` repo.

#### **projects.json**
A JSON array with the extended project structure:
```json
[
  {
    "name": "Code Review Crew",
    "description": "Multi-agent AI...",
    "tech": ["Python", "CrewAI", "FastAPI"],
    "repo": "https://github.com/...",
    "demo": null,
    "highlights": ["4 specialized agents", ...],
    "status": "completed",
    "category": "cv"
  },
  ...
]
```

---

## Data Flows

### get_cv(lang, section) Flow

```
Client Request
  │
  ├─ Validate lang (default: "en")
  │
  ├─ loadCv(lang)
  │   ├─ Check cache
  │   ├─ If miss: readFileSync(cv-*.md) → parseCv()
  │   ├─ Cache result
  │   └─ Return CvData
  │
  ├─ If section requested
  │   ├─ getSection(cv, section)
  │   │   ├─ Direct match
  │   │   ├─ Case-insensitive match
  │   │   ├─ Partial match
  │   │   └─ Alias match
  │   ├─ Found? → textResult(section)
  │   └─ Not found? → errorResult(available sections)
  │
  └─ If no section
      └─ textResult(cv.raw)  // Full Markdown

Response to Client
```

### match_job(description) Flow

```
Client Request
  │
  ├─ loadCv("en")
  │
  ├─ matchJob(description, cv)
  │   ├─ extractCvSkills(cv) → skills: string[]
  │   ├─ extractTechFromDescription(desc) → jobTechs: string[]
  │   │
  │   ├─ For each jobTech:
  │   │   ├─ normalizeSkill(jobTech)
  │   │   ├─ Search in cvSkills with skillsMatch()
  │   │   ├─ Found? → matchedSkills.push(original)
  │   │   └─ Not? → missingSkills.push(jobTech)
  │   │
  │   ├─ extractExperienceBullets(cv)
  │   │ ├─ For each bullet:
  │   │ │   └─ Count jobDescription words in bullet
  │   │ ├─ Filter >= 2 matches
  │   │ ├─ Sort by count desc
  │   │ └─ Take top 5
  │   │
  │   ├─ Calculate score
  │   │   ├─ score = (matched / total) * 100
  │   │   ├─ score += min(relevantExp.length * 2, 10)
  │   │   └─ clamp to 0-100
  │   │
  │   ├─ generatePitch(name, matched, missing, experience, score)
  │   │   ├─ If score >= 70 → strong fit pitch
  │   │   ├─ If 40-69 → partial fit pitch
  │   │   └─ If < 40 → low fit pitch
  │   │
  │   └─ Return MatchResult
  │
  ├─ Format MatchResult to structured text
  │   ├─ Fit Score: X/100
  │   ├─ Matching Skills: [...]
  │   ├─ Gaps: [...]
  │   ├─ Relevant Experience: [...]
  │   └─ Suggested Pitch: [...]
  │
  └─ textResult(formatted)

Response to Client
```

### ask_about_me(question) Flow

```
Client Request
  │
  ├─ extractKeywords(question)
  │   ├─ Lowercase
  │   ├─ Remove punctuation
  │   ├─ Split by whitespace
  │   ├─ Filter length > 2
  │   └─ Filter STOP_WORDS
  │
  ├─ loadCv("en")
  │
  ├─ Search CV sections
  │   └─ For each section:
  │       └─ For each paragraph:
  │           └─ Count keyword matches
  │               └─ If > 0: push SearchResult(section, text, score)
  │
  ├─ Search Projects
  │   └─ For each project:
  │       └─ Concat name + desc + tech + highlights
  │       └─ Count keyword matches
  │           └─ If > 0: push SearchResult("Projects", formatted, score)
  │
  ├─ Sort results by score desc
  ├─ Take top 10
  ├─ Group by section
  │
  └─ Format and textResult(grouped results)

Response to Client
```

---

## Design Decisions

### 1. **No over-engineering**
- Don't use embeddings (complicated, slow)
- Use simple keyword matching
- Pre-compiled regexes for performance

### 2. **Bilingual by design**
- Two complete CVs (en/pt-br)
- Stop words in both languages
- Aliases in both languages

### 3. **Natural-text output**
- Don't return raw JSON
- Readable formatted Markdown
- Better consumed by LLMs

### 4. **Defensive caching**
- Load the data once
- In-memory maps for O(1) lookup
- Don't refresh during runtime

### 5. **Selective Zod validation**
- Handler input validated with Zod (CLI safety)
- Data files without strict validation (trusting the build)
- Fail fast, with clear errors

### 6. **Zero extra dependencies**
- Only the MCP SDK is mandatory
- Zod for validation (2 deps total)
- Everything else: the Node.js stdlib

### 7. **Honesty in matching**
- Report real gaps
- A score calibrated with experience
- A pitch adjusted to the real fit

---

## Error Handling Patterns

### Defensive try-catch
```typescript
export function safeLoadCv<T>(loader: () => T): T | ToolResponse {
  try {
    return loader();
  } catch {
    return errorResult("Data file not found. Ensure the server was built.");
  }
}
```

### Input validation
```typescript
inputSchema: {
  description: z
    .string()
    .min(10, "Job description must be at least 10 characters")
    .describe("..."),
}
```

### User-friendly error messages
```typescript
if (filtered.length === 0) {
  const allTechs = [...new Set(projects.flatMap(p => p.tech))].sort();
  return errorResult(
    `No projects found matching "${args.tech}".\n\n` +
    `Available technologies: ${allTechs.join(", ")}`
  );
}
```

---

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Loading the CV (first time) | ~5ms | Reads the file, parses, caches |
| Loading the CV (cached) | <1ms | Map lookup |
| Match job | ~20-50ms | Regexes over techs + extraction |
| Ask about me | ~10-30ms | Keyword matching, sorting |
| List projects | <5ms | Array filter, format |

---

## Testing & Debugging

### Expected Data Structure

**cv-en.md:**
```
# Name
Title
Contact
---

## Section1
content

## Section2
content
```

**projects.json:**
```json
[
  { "name", "description", "tech", "repo", "demo", "highlights", "status", "category" },
  ...
]
```

### Debug Mode

```bash
# Print input args
export DEBUG=mcp-me:*
npm run dev

# Use the MCP Inspector to see requests/responses
npm run inspect
```

---

## Migration and Versioning

Version: 1.0.0 (stable)

There is no versioning of the data files. The CVs are synced manually. The projects are edited inline.

For future versions:
- Bump `version` in `server.ts` and `package.json`
- Keep a changelog in CHANGELOG.md
- Keep deprecated tools in place with a warning
