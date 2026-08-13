# mcp-me: Personal MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that turns professional data into tools an LLM can consume. Instead of a recruiter reading a static CV PDF, they (or an agent) ask questions and get real, structured data back.

**Status:** Production | **Version:** 1.0.0 | **Runtime:** Node.js + TypeScript

## Overview

mcp-me exposes 4 MCP tools that query:

- **Bilingual CVs** (EN / PT-BR) in Markdown as the source of truth
- **Expanded project data** (repository, demo, technical highlights, status)
- **Job ↔ profile fit analysis** with skill matching
- **Keyword search** across the entire professional history

It suits:
- Recruiting agents that analyze job postings automatically
- LLMs that need structured biographical data
- Personal assistants that answer questions about experience
- Automating candidate-job compatibility analyses

## Characteristics

- Full support for English and Brazilian Portuguese
- Only 2 dependencies (MCP SDK + Zod)
- Strict TypeScript with Zod validation
- Efficient in-memory loading
- Markdown parsed by hand
- `match_job` reports real gaps instead of inflating the profile
- Structured natural text, not raw JSON

## MCP Tools

### 1. `get_cv`

Returns the complete CV or a specific section.

**Input:**
```json
{
  "lang": "en" | "pt-br",  // optional, default: "en"
  "section": "summary" | "skills" | "experience" | "projects" | "education" | "certifications" | "languages"  // optional
}
```

**Output:** Formatted Markdown text with the CV or the requested section.

**Usage examples:**
```
get_cv({ lang: "pt-br" })
→ Returns the full CV in Portuguese

get_cv({ lang: "en", section: "skills" })
→ Returns only the technical skills section, in English

get_cv({ section: "professional experience" })
→ Partial match: returns the experience section
```

---

### 2. `list_projects`

Lists projects with full metadata: description, stack, highlights, repository URL, demo URL, and status.

**Input:**
```json
{
  "tech": "Next.js" | "Python" | "React" | ...  // optional, case-insensitive, partial match
}
```

**Output:** A formatted list of projects with structured fields.

**Status:** `"completed"` | `"in-progress"` | `"active"` | `"experimental"`
**Category:** `"cv"` (featured on the CV) | `"additional"` (extras on GitHub)

**Usage examples:**
```
list_projects()
→ Lists all 8+ projects

list_projects({ tech: "next" })
→ Filters projects using Next.js, returns 2-3 results

list_projects({ tech: "python" })
→ Filters projects using Python, returns the AI/data projects
```

---

### 3. `match_job`

Analyzes the fit between the profile and a job description. It returns:
- **Fit Score** (0-100): the percentage of the job description's technical skills present in the CV
- **Matching Skills**: skills present on both sides
- **Gaps**: required skills that are not in the CV
- **Relevant Experience**: excerpts of professional experience aligned with the role
- **Suggested Pitch**: an honest assessment calibrated to the score

**Input:**
```json
{
  "description": "Fullstack Engineer needed for Next.js/React + Python FastAPI microservices..."
}
```

**Output:** A structured analysis with the score, matching skills, gaps, and pitch.

**Score interpretation:**
- **70-100:** Strong fit — the candidate is clearly aligned with the role
- **40-69:** Partial fit — there is overlap, but significant gaps
- **0-39:** Low fit — this would be a career pivot, not a natural next step

**Examples:**
```
match_job({ description: "React + TypeScript + Node.js backend engineer needed..." })
→ Score: 92, Matching Skills: React, TypeScript, Node.js, ...
→ Gaps: (none), Suggested Pitch: Strong fit...

match_job({ description: "Lead Golang architect, 10 years Go experience required..." })
→ Score: 15, Matching Skills: (none), Gaps: Go, Kubernetes orchestration, ...
→ Suggested Pitch: Limited overlap, significant career pivot...
```

---

### 4. `ask_about_me`

Runs a keyword search across the whole profile (CV + projects) and returns the 10 most relevant excerpts, grouped by section.

**Input:**
```json
{
  "question": "ETL experience?" | "databases usados?" | "tem experiência com IA?" | ...
}
```

**Output:** Experience excerpts grouped by section (Professional Experience, Projects, and so on)

**Supports:**
- Keywords in English and Portuguese
- Searching by technology, role, or concept
- Stop-word filtering to reduce noise

**Examples:**
```
ask_about_me({ question: "ETL experience" })
→ Returns experience with data pipelines, Airflow, and so on

ask_about_me({ question: "tem experiência com IA?" })
→ Returns projects and experience with LLMs, CrewAI, and so on

ask_about_me({ question: "Docker Kubernetes" })
→ Returns sections on DevOps, containerization, and orchestration
```

---

## Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js 22+ (ES Modules) |
| **Language** | TypeScript 5.7 |
| **Protocol** | MCP SDK `@modelcontextprotocol/sdk` ^1.12.1 |
| **Validation** | Zod `^3.25.67` |
| **Build** | tsup 8.0 |
| **Linting** | Biome 1.9 |
| **Transport** | stdio (standard stdin/stdout communication) |

## Installation

### Prerequisites
- **Node.js 22+** (check with `node --version`)
- **npm 10+** (or yarn/pnpm)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/fe-m-bueno/mcp-me.git
cd mcp-me

# 2. Install the dependencies
npm install

# 3. Build
npm run build

# 4. Verify the build
ls dist/
# You should see: index.js, index.d.ts (sourcemaps), data/ (CVs + projects)
```

### Post-Build Structure

```
dist/
├── index.js           # Compiled entry point
├── index.js.map       # Sourcemap
├── index.d.ts         # TypeScript types
└── data/
    ├── cv-en.md       # CV in English
    ├── cv-ptbr.md     # CV in Portuguese
    └── projects.json  # Project data
```

## Usage

### As an MCP Server (in a client)

Configure it in your MCP client (Claude Desktop, Cline, and so on):

**macOS/Linux — `~/.config/Claude/claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "me": {
      "command": "node",
      "args": ["/home/felipebueno/Development/mcp-me/dist/index.js"]
    }
  }
}
```

**Windows — `%APPDATA%/Claude/claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "me": {
      "command": "node",
      "args": ["C:/Users/felipebueno/Development/mcp-me/dist/index.js"]
    }
  }
}
```

After configuring it, restart the MCP client. The 4 tools will show up as available.

### Local Testing with MCP Inspector

```bash
npm run inspect
```

This opens a web interface at `http://localhost:3000` for testing the tools interactively.

### Testing with Node.js Directly

```bash
# Terminal 1: start the server
node dist/index.js

# Terminal 2: connect via stdio
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/index.js
```

## Development

### Code Structure

```
src/
├── index.ts              # Entry point, stdio transport
├── server.ts             # Definition of the 4 tools with descriptions
├── tools/
│   ├── cv.ts             # get_cv handler
│   ├── projects.ts       # list_projects handler
│   ├── match.ts          # match_job handler
│   └── ask.ts            # ask_about_me handler
├── lib/
│   ├── parser.ts         # Parses Markdown into sections
│   ├── matcher.ts        # Job ↔ profile matching logic
│   ├── projects.ts       # Loads projects.json
│   ├── response.ts       # Response utilities (ToolResponse)
│   └── paths.ts          # Resolves data/ paths
└── data/
    ├── cv-en.md          # CV in English
    ├── cv-ptbr.md        # CV in Portuguese
    └── projects.json     # Project data with metadata
```

### Development Workflow

```bash
# 1. Develop with watch
npm run dev

# 2. Lint as you go
npm run lint
npm run lint:fix

# 3. Final build
npm run build

# 4. Test with the Inspector
npm run inspect
```

### Adding a New Tool

1. Create `src/tools/new-tool.ts` with an async handler
2. Register it in `server.ts` with `server.registerTool()`
3. Export it from `index.ts` (this happens automatically)
4. Rebuild and test via `npm run inspect`

**Example:**
```typescript
// src/tools/new-tool.ts
import { loadCv } from "../lib/parser.js";
import { ToolResponse, textResult } from "../lib/response.js";

export async function newToolHandler(args: {
  query: string;
}): Promise<ToolResponse> {
  const cv = loadCv("en");
  // your logic here
  return textResult("resultado");
}
```

### Updating the Data

**CVs:** Copy them from `~/Development/cv/` to `src/data/cv-*.md`

```bash
cp ~/Development/cv/cv-en.md src/data/
cp ~/Development/cv/cv-ptbr.md src/data/
npm run build
```

**Projects:** Edit `src/data/projects.json` directly

```bash
vim src/data/projects.json
npm run build
```

## Configuration

### Environment Variables

None needed at the moment. All data is static, in `src/data/`.

### Data Directory

The server looks for data in `src/data/` at build time (resolved via `lib/paths.ts`). At runtime, the files live in `dist/data/`.

### TypeScript/Zod

**tsconfig.json:**
- Target: ES2022
- Module: Node16 (ESM)
- Strict mode enabled
- JSON resolution enabled

**biome.json:**
- Formatter: tabs (indentation)
- Linter: recommended rules
- Organize imports: enabled

## Performance and Optimizations

### In-Memory Cache

CVs and projects are loaded once at startup and kept in a cache:

```typescript
const cvCache = new Map<string, CvData>();
export function loadCv(lang: "en" | "pt-br"): CvData {
  const cached = cvCache.get(lang);
  if (cached) return cached;
  // load from disk, then cache
}
```

### Efficient Matching

- Pre-compiled regexes for tech keywords (`TECH_PATTERNS`)
- Skill normalization with simple rules (lowercase, strip . - /)
- Stop-word filtering in `ask_about_me`

### Minimal Size

- No extra dependencies (just the MCP SDK + Zod)
- Manual parsing, no libraries
- Bundle: ~200KB minified

## Troubleshooting

### "Data file not found"

Make sure you ran `npm run build`. The build copies `src/data/` to `dist/data/`.

```bash
npm run build
ls dist/data/
```

### A Tool Returns an Undefined Error

Check that the absolute path in `claude_desktop_config.json` is correct:

```bash
ls /home/felipebueno/Development/mcp-me/dist/index.js
# It must exist
```

### MCP Inspector Won't Open

Port 3000 may be in use. Change the port or kill the process:

```bash
lsof -i :3000
kill -9 <PID>
npm run inspect
```

### Linting Failing

```bash
npm run lint:fix
```

Biome fixes formatting and import problems automatically.

## Contributing

This is a personal project, but if you want to suggest improvements:

1. Fork it
2. Create a branch for your feature (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add X"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## Contact

**Felipe Bueno**
GitHub: [@fe-m-bueno](https://github.com/fe-m-bueno)
Email: felipebueno.dev@gmail.com
