# mcp-me

## About the Project

A personal MCP server that turns professional data into tools an LLM can consume. Instead of a recruiter reading a PDF, they (or an agent) ask, and the server answers with real, structured data. It pulls data from local files (Markdown CVs) and a projects file as its source of truth.

## Stack

- **Runtime:** Node.js (TypeScript)
- **Protocol:** MCP SDK (`@modelcontextprotocol/sdk`)
- **Build:** tsup
- **Linting:** Biome

## Structure

```
mcp-me/
├── src/
│   ├── index.ts              # Entry point — stdio transport
│   ├── server.ts             # Tool registration on the MCP server
│   ├── tools/
│   │   ├── cv.ts             # get_cv — returns the full CV or specific sections
│   │   ├── projects.ts       # list_projects — projects with stack, description, links
│   │   ├── match.ts          # match_job — takes a job description, analyzes the fit
│   │   └── ask.ts            # ask_about_me — keyword search across the experience
│   ├── data/
│   │   ├── cv-en.md          # CV in English (synced from the cv/ repo)
│   │   ├── cv-ptbr.md        # CV in Portuguese (synced from the cv/ repo)
│   │   └── projects.json     # Expanded project data (links, demos, highlights)
│   └── lib/
│       ├── parser.ts         # Parses the Markdown into a navigable structure
│       └── matcher.ts        # Job ↔ profile matching logic
├── tsconfig.json
├── package.json
├── biome.json
└── CLAUDE.md
```

## MCP Tools

| Tool | Input | Output |
|------|-------|--------|
| `get_cv` | `{ lang?: "en" \| "pt-br", section?: string }` | The full CV or a specific section (summary, skills, experience, and so on) |
| `list_projects` | `{ tech?: string }` | Projects filterable by technology, with description, stack, and links |
| `match_job` | `{ description: string }` | Fit analysis: matching skills, gaps, score, suggested pitch |
| `ask_about_me` | `{ question: string }` | Keyword/context search across the experience, returning relevant excerpts |

## Data

- The Markdown CVs are the source of truth — they live in `src/data/`, copied from the `~/Development/cv/` repo
- `projects.json` expands the CV's projects with extra fields: repo URL, demo URL, technical highlights, status
- Markdown parsing splits the CV into navigable sections (H2 headings as the key)

## Conventions

- Tool output is **structured natural text**, not raw JSON — LLMs consume it better
- `match_job` must be honest: list real gaps, don't inflate the profile
- Code in English, output bilingual according to `lang`
- Zero dependencies beyond the MCP SDK — Markdown parsing is done by hand (it's simple)
- No over-engineering: start with simple keyword matching in `ask_about_me`, no embeddings

## Commands

```bash
npm install          # Install the dependencies
npm run build        # Build with tsup
npm run dev          # Dev mode with watch
npm run lint         # Lint with Biome
npm run inspect      # Test with the MCP Inspector
```

## MCP Client Configuration

```json
{
  "mcpServers": {
    "me": {
      "command": "node",
      "args": ["path/to/mcp-me/dist/index.js"]
    }
  }
}
```
