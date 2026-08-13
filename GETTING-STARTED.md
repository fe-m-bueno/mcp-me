# Getting Started: mcp-me

A step-by-step guide to setting up, building, and using the mcp-me MCP server for the first time.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Build](#build)
4. [Configuration](#configuration)
5. [First Use](#first-use)
6. [Next Steps](#next-steps)

---

## Prerequisites

Before you start, make sure you have the following installed:

### Node.js 22+

```bash
# Check the installed version
node --version
# Expected: v22.x.x or later

# If you don't have Node 22:
# Option 1: using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22

# Option 2: Homebrew (macOS)
brew install node@22
brew link node@22

# Option 3: the official installer
# https://nodejs.org/en/download/
```

### npm 10+

```bash
# npm ships with Node.js
# Check the version
npm --version
# Expected: 10.x.x or later

# If you need to update it
npm install -g npm@latest
```

### Git (optional, for cloning the repository)

```bash
git --version
# If you don't have it, install it for your OS
```

### An MCP Client (to use the server)

Pick one:
- **Claude Desktop** (recommended): https://claude.ai/download
- **Cline (VS Code)**: https://github.com/cline/cline
- **Any other tool with MCP support**

---

## Installation

### Step 1: Clone or Copy the Repository

**Via Git:**
```bash
git clone https://github.com/fe-m-bueno/mcp-me.git
cd mcp-me
```

**Or manually:**
Download the repository zip, extract it, and enter the directory.

### Step 2: Install the Dependencies

```bash
npm install
```

Wait a few seconds. You should see:
```
added 247 packages in 5.23s
```

### Step 3: Verify the Installation

```bash
npm --version
# npm 10.x.x

node --version
# v22.x.x

ls node_modules/@modelcontextprotocol
# Should list: sdk

ls node_modules/zod
# Should exist
```

If everything looks right, move on to **Build**.

---

## Build

### Step 1: Build the Project

```bash
npm run build
```

You should see:
```
dist/index.js    30.1 kB
dist/index.d.ts  15.3 kB
```

**What happens:**
1. TypeScript is compiled to JavaScript (tsup)
2. Sourcemaps are generated for debugging
3. Data files (CVs, projects) are copied to `dist/data/`

### Step 2: Check the Result

```bash
ls -la dist/
```

You should see:
```
-rw-r--r-- index.js          (compiled)
-rw-r--r-- index.js.map      (sourcemap)
-rw-r--r-- index.d.ts        (types)
drwxr-xr-x data/             (CVs + projects)
```

```bash
ls -la dist/data/
```

You should see:
```
-rw-r--r-- cv-en.md       (CV in English)
-rw-r--r-- cv-ptbr.md     (CV in Portuguese)
-rw-r--r-- projects.json  (project data)
```

### Step 3: Test the Build

```bash
node dist/index.js &
# The process starts in the background

sleep 1
echo "Build OK"
kill %1
```

If no errors appear, the build worked.

---

## Configuration

### Step 1: Find Your Configuration File

The path depends on your MCP client.

**Claude Desktop:**
```bash
# macOS
cat ~/.config/Claude/claude_desktop_config.json

# Windows
type %APPDATA%\Claude\claude_desktop_config.json

# Linux
cat ~/.config/Claude/claude_desktop_config.json
```

**Cline (VS Code):**
You configure it directly in the VS Code settings: `Cline > MCP Servers`

### Step 2: Get the Absolute Path

You need the full path to `dist/index.js`.

```bash
# In the mcp-me directory:
pwd
# Example output: /home/felipebueno/Development/mcp-me

# Combine it with dist/index.js:
echo "$(pwd)/dist/index.js"
# Output: /home/felipebueno/Development/mcp-me/dist/index.js
```

**Windows (PowerShell):**
```powershell
(Get-Location).Path + "\dist\index.js"
# Output: C:\Users\felipebueno\Development\mcp-me\dist\index.js
```

### Step 3: Configure the Client

#### Claude Desktop

Edit or create `~/.config/Claude/claude_desktop_config.json`:

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

**Windows:**
```json
{
  "mcpServers": {
    "me": {
      "command": "node",
      "args": ["C:\\Users\\felipebueno\\Development\\mcp-me\\dist\\index.js"]
    }
  }
}
```

**Cline (VS Code):**
1. Open the Command Palette: `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P`
2. Search for "Cline: Open MCP Server Settings"
3. Add an entry:
```json
{
  "me": {
    "command": "node",
    "args": ["/home/felipebueno/Development/mcp-me/dist/index.js"]
  }
}
```

### Step 4: Restart Your Client

- **Claude Desktop:** Quit (Cmd+Q) and reopen
- **Cline:** Reload Window (Cmd+R or F5)
- **Any other client:** Restart as needed

---

## First Use

### Test 1: Check That the Tools Are Available

**Claude Desktop:**
1. Open a new conversation
2. Click the tools icon (wrench) in the bottom bar
3. You should see 4 tools listed:
   - `get_cv`
   - `list_projects`
   - `match_job`
   - `ask_about_me`

**If they don't show up:**
- Check the path in `claude_desktop_config.json`
- Make sure `npm run build` ran
- Restart Claude Desktop completely

### Test 2: Call `get_cv`

In the Claude conversation, ask:

```
Show me the Technical Skills section of his CV in Portuguese
```

Claude should use the `get_cv` tool and return the skills section in Portuguese.

**Expected:**
```
## Technical Skills / Competências Técnicas (Portuguese)

**Frontend:** React, Next.js, TypeScript, TailwindCSS, ...
**Backend:** Node.js, Python, FastAPI, ...
...
```

### Test 3: Call `list_projects`

Ask:

```
What React projects does he have?
```

Claude should use `list_projects` and return the projects filtered by React.

**Expected:**
```
## Felipe Bueno's Projects (filtered by: React)

Found X project(s):

### Project Name (Status)
**Stack:** React, Next.js, TypeScript, ...
**Description:** The project's description
**Highlights:**
- Technical point 1
- Technical point 2
**Repo:** https://github.com/...
**Demo:** https://demo.vercel.app
```

### Test 4: Call `match_job`

Ask:

```
Analyze whether his profile matches this role:

Senior React engineer with 5+ years building user-facing applications.
Must know Next.js, TypeScript, PostgreSQL. Bonus: GraphQL, Docker.
```

Claude should use `match_job` and return a detailed analysis.

**Expected:**
```
## Job Fit Analysis for Felipe Bueno

**Fit Score: 85/100**

### Matching Skills (5)
React, TypeScript, Next.js, Docker, GraphQL

### Gaps (1)
PostgreSQL

### Relevant Experience
- Built application X with React and Next.js...
- Mentored the team on TypeScript...

### Suggested Pitch
Felipe is a strong fit for this role, bringing hands-on experience with...
```

### Test 5: Call `ask_about_me`

Ask:

```
Does he have experience with microservices architecture?
```

Claude should use `ask_about_me` to look the information up.

**Expected:**
```
Based on the question "microservices architecture", here are relevant details about Felipe:

**From Professional Experience:**
- Designed microservices architecture for...
- Implemented event-driven microservices with...

**From Projects:**
- **Project Name** (Tech1, Tech2) — Technical point; Another point
```

---

## Next Steps

### 1. Explore the Tools More Deeply

Now that it works, try real use cases:

```
"Does he have machine learning experience?"
"Qual stack ele usa para backend?"
"Which databases does he know best?"
"Match against this Data Engineer role..."
```

### 2. Integrate It Into Your Workflow

If you are a recruiter or an agent:

- Use `ask_about_me` for specific questions
- Use `match_job` to analyze roles automatically
- Combine `get_cv` and `list_projects` for a holistic view

### 3. Customize It for Your Case

If you want to adapt it to your own profile:

1. **Update the CV:**
   - Edit or copy your own CV into `src/data/cv-en.md`
   - Keep the Markdown format with ## sections

2. **Update the projects:**
   - Edit `src/data/projects.json` with your projects

3. **Rebuild:**
   ```bash
   npm run build
   ```

4. **Restart the server:**
   - Restart Claude Desktop or your client

### 4. Local Development

If you want to change the code:

```bash
# Start dev mode with watch
npm run dev

# In another terminal, test it
npm run inspect
# Opens a GUI at http://localhost:3000
```

Edit the code in `src/`, and the build recompiles automatically.

### 5. Future Features

Ideas for future expansion:

- **New tool:** `get_timeline` — experience in chronological order
- **New tool:** `recommend_roles` — roles recommended based on the profile
- **Integration:** the LinkedIn API for stats
- **Dashboard:** analytics on the most common questions

---

## Quick Troubleshooting

### "The tools don't show up"

```bash
# 1. Check the path
cat ~/.config/Claude/claude_desktop_config.json | grep args

# 2. Check that the file exists
ls /home/felipebueno/Development/mcp-me/dist/index.js

# 3. Rebuild
npm run build

# 4. Restart Claude Desktop (Cmd+Q, then reopen)
```

### "Data file not found"

```bash
# Run a full build
npm run build

# Check that the data files were copied
ls dist/data/
# There should be 3 files

# If not:
cp src/data/* dist/data/
```

### "A tool returns an error"

Check that you are using the right arguments:

```
get_cv: { lang?: "en" | "pt-br", section?: string }
list_projects: { tech?: string }
match_job: { description: string }  (required)
ask_about_me: { question: string }
```

### "Linting or the build is failing"

```bash
# Auto-fix
npm run lint:fix

# Rebuild
npm run build
```

---

## Related Documentation

Now that everything works:

- **README.md** — Project overview and tool reference
- **ARCHITECTURE.md** — Technical architecture and data flows
- **RUNBOOK.md** — Troubleshooting, debugging, and maintenance

---

## Support

If you run into problems:

1. **Check the Troubleshooting section of RUNBOOK.md**
2. **Check the logs:**
   ```bash
   # Test the server manually
   node dist/index.js 2>&1 | head -20
   ```
3. **Test with the MCP Inspector:**
   ```bash
   npm run inspect
   # Opens a GUI at http://localhost:3000
   ```

---

## Final Checklist

You have finished successfully if:

- [ ] Node.js 22+ is installed
- [ ] The repository is cloned or copied
- [ ] `npm install` ran
- [ ] `npm run build` completed without errors
- [ ] The MCP client is configured with the right path
- [ ] The 4 tools appear in the client
- [ ] `get_cv` returns data
- [ ] `list_projects` returns data
- [ ] `match_job` works with a job description
- [ ] `ask_about_me` works with questions

Congratulations — you are ready to use mcp-me.

---

## Recommended Reading Next

1. **README.md** — Understand all the tools and their uses
2. **ARCHITECTURE.md** — Learn how everything works internally
3. **RUNBOOK.md** — For when you need to debug or maintain it

Happy prompting!
