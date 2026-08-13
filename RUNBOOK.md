# Runbook: mcp-me

An operational guide for troubleshooting, maintenance, debugging, and common operations.

## Contents

1. [Troubleshooting](#troubleshooting)
2. [Data Maintenance](#data-maintenance)
3. [Debugging](#debugging)
4. [Logs and Monitoring](#logs-and-monitoring)
5. [Performance](#performance)
6. [Security](#security)
7. [Running in Production](#running-in-production)

---

## Troubleshooting

### Problem: "Data file not found"

When any tool returns this error.

**Root cause:**
- The build was not run
- Files in `src/data/` were not copied to `dist/data/`
- The absolute path to `dist/` is wrong in the MCP client

**Fix:**

1. Check that the build ran:
```bash
ls dist/data/
# Should list: cv-en.md, cv-ptbr.md, projects.json
```

2. If they don't exist, run the build:
```bash
npm run build
```

3. Check the permissions:
```bash
stat dist/data/cv-en.md
# It must be readable
chmod 644 dist/data/*
```

4. In the MCP client, confirm the absolute path:
```bash
# macOS/Linux
cat ~/.config/Claude/claude_desktop_config.json | jq '.mcpServers.me.args[0]'
# It must be an absolute path that exists

# Check that the path exists
ls /home/felipebueno/Development/mcp-me/dist/index.js
```

---

### Problem: A Tool Doesn't Show Up in the Client

When `get_cv`, `list_projects`, and so on don't appear in the tool list.

**Root cause:**
- The server did not initialize correctly
- The stdio transport did not connect
- The client did not see the capabilities response

**Fix:**

1. Test it manually:
```bash
npm run inspect
# Opens the MCP Inspector at http://localhost:3000
# It should list 4 tools under "Models"
```

2. If the Inspector doesn't work, check stderr:
```bash
node dist/index.js 2>&1 | head -20
# Any error will show up here
```

3. Test with an echo:
```bash
# Terminal 1
node dist/index.js

# Terminal 2: simulate the MCP handshake
cat <<'EOF' | node dist/index.js
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
EOF
```

4. Check that index.js was compiled:
```bash
file dist/index.js
# Should be "JavaScript source"

head -1 dist/index.js
# Should have #!/usr/bin/env node (the shebang)
```

5. Restart the MCP client:
```bash
# Claude Desktop: Quit + relaunch
# Cline: Reload window
```

---

### Problem: A Tool Returns Empty or Unexpected Results

When a tool returns inconsistent data.

**get_cv:**
```bash
# Test with curl (simulating an MCP call)
npm run inspect
# In the Inspector, try different langs and sections

# Section not found?
curl -X POST http://localhost:3000/tool \
  -H "Content-Type: application/json" \
  -d '{"tool":"get_cv","args":{"section":"invalid"}}'
# Should return the list of available sections with isError: true
```

**list_projects:**
```bash
# Test the tech filter
npm run inspect
# Try "React", "Python", "Next.js"

# No projects found?
cat src/data/projects.json | jq '.[].tech' | sort -u
# See which techs exist
```

**match_job:**
```bash
# Test with a real job description
npm run inspect
# Paste a job posting

# Low score?
# - Check that the CV's skills are in the "Technical Skills" section
# - Check that the job description contains recognized tech keywords
```

**ask_about_me:**
```bash
# Test with simple questions
npm run inspect
# "Python experience?"
# "React projects?"

# No results?
# - It may be a stop word: try more specific keywords
# - Check that the keyword appears in the CV/projects
```

---

### Problem: Linting Fails During the Build

When `npm run build` or `npm run lint` fails.

**Root cause:**
- Inconsistent spacing
- Unorganized imports
- Unused variables

**Fix:**

```bash
# Auto-fix
npm run lint:fix

# Check what changed
git diff

# If it still fails, look at the details
npm run lint
# Biome lists exactly what is wrong
```

---

### Problem: Incompatible Node.js Version

When `node dist/index.js` fails with a syntax error.

**Root cause:**
- Node.js < 22
- A version incompatible with ES Modules

**Fix:**

```bash
# Check the version
node --version
# Should be v22.x.x or later

# Install Node 22+
# Via nvm
nvm install 22
nvm use 22

# Or via Homebrew (macOS)
brew install node@22

# Rebuild after upgrading
npm run build
```

---

### Problem: Port 3000 Already in Use (MCP Inspector)

When `npm run inspect` fails.

**Root cause:**
- Another process is using port 3000
- A previous Inspector did not shut down

**Fix:**

```bash
# Find out which process
lsof -i :3000
# Or on Windows
netstat -ano | findstr :3000

# Kill the process
kill -9 <PID>
# Or on Windows
taskkill /PID <PID> /F

# Try again
npm run inspect
```

---

### Problem: The CV or Projects Don't Update

When you edit `src/data/` but the server doesn't see the changes.

**Root cause:**
- The in-memory cache was not cleared
- The data was not synced from the cv/ repo
- The build did not copy the new data

**Fix:**

```bash
# If you are in development (npm run dev)
# The watcher only recompiles TypeScript; it does not copy data

# Fix: copy the data manually
cp ~/Development/cv/cv-en.md src/data/
cp ~/Development/cv/cv-ptbr.md src/data/

# Full rebuild
npm run build

# The cache is cleared when the server restarts
```

**For projects.json:**
```bash
# Edit it directly
vim src/data/projects.json

# Rebuild
npm run build

# If you're in dev mode, restart manually:
# Ctrl+C and run npm run dev again
```

---

## Data Maintenance

### Syncing the CVs from the cv/ Repo

The CVs are the source of truth. Keep them in sync.

```bash
# Check the cv/ repo's structure
ls ~/Development/cv/
# Should contain: cv-en.md, cv-ptbr.md

# Sync
cp ~/Development/cv/cv-en.md /home/felipebueno/Development/mcp-me/src/data/
cp ~/Development/cv/cv-ptbr.md /home/felipebueno/Development/mcp-me/src/data/

# Check the diffs
diff ~/Development/cv/cv-en.md /home/felipebueno/Development/mcp-me/src/data/cv-en.md

# Rebuild
cd /home/felipebueno/Development/mcp-me
npm run build
```

### Adding a New Project

1. Edit `src/data/projects.json`:
```json
{
  "name": "New Project",
  "description": "A concise description",
  "tech": ["Tech1", "Tech2"],
  "repo": "https://github.com/fe-m-bueno/repo-url",
  "demo": "https://demo.vercel.app",
  "highlights": [
    "Technical point 1",
    "Technical point 2"
  ],
  "status": "completed",
  "category": "cv"
}
```

2. Validate the JSON:
```bash
cat src/data/projects.json | jq '.' > /dev/null && echo "OK"
```

3. Rebuild:
```bash
npm run build
```

4. Test:
```bash
npm run inspect
# Under Projects, test `list_projects({ tech: "Tech1" })`
```

### Updating the Skills Section

1. Edit the CV:
```bash
vim src/data/cv-en.md
# Find ## Technical Skills
# Update the list
```

2. Expected format:
```markdown
## Technical Skills

**Frontend:** React, Next.js, TypeScript, TailwindCSS
**Backend:** Node.js, FastAPI, Python
**Databases:** PostgreSQL, MongoDB, Redis
**DevOps:** Docker, Kubernetes, AWS
```

3. Rebuild:
```bash
npm run build
```

4. Test the matching:
```bash
npm run inspect
# Test match_job with a job description that includes your skills
```

---

## Debugging

### Enabling Detailed Logs

There is no built-in logging system. Use manual console.log or the Debug module.

```typescript
// In lib/matcher.ts, for example
import debug from 'debug';
const log = debug('mcp-me:matcher');

// Your code
log('Extracting tech from description:', jobDescription);
```

Run it with:
```bash
DEBUG=mcp-me:* npm run dev
```

### Inspecting the Parsed Structure

Check that the CV was parsed correctly:

```bash
node -e "
import { loadCv } from './dist/lib/parser.js';
const cv = loadCv('en');
console.log('Header:', cv.header);
console.log('Sections:', Array.from(cv.sections.keys()));
console.log('Skills sample:', cv.sections.get('Technical Skills')?.slice(0, 200));
" 2>&1
```

### Testing the Matching Without MCP

Test `matchJob` directly:

```bash
node -e "
import { loadCv } from './dist/lib/parser.js';
import { matchJob } from './dist/lib/matcher.js';

const cv = loadCv('en');
const jobDesc = 'React senior engineer with 5 years experience, must know Next.js';
const result = matchJob(jobDesc, cv);
console.log(JSON.stringify(result, null, 2));
" 2>&1
```

### Testing the CV Parser

```bash
node -e "
import { loadCv, getSectionNames } from './dist/lib/parser.js';
const cv = loadCv('pt-br');
console.log('Available sections:');
console.log(getSectionNames(cv));
console.log('\\nExperience preview:');
console.log(cv.sections.get('Experiência Profissional')?.slice(0, 300));
" 2>&1
```

---

## Logs and Monitoring

### Where Are the Logs?

There is no centralized logging. Logs go to stderr/stdout.

In Claude Desktop, look in:
```bash
# macOS
~/Library/Logs/Claude

# Windows
%APPDATA%/Claude/logs

# Linux (via Cline)
# Check Cline's "Output" tab
```

### Capturing the Server's stderr

When `node dist/index.js` is running as an MCP server:

```bash
# In the MCP client (Claude Desktop), open the developer console
# Cmd+Shift+I (Windows/Linux) or Cmd+Opt+I (macOS)
# Look for "mcp-me" logs
```

### Server Health Check

```bash
# Check that the process is running
ps aux | grep "mcp-me\|node dist/index.js"

# Check that the stdio port works
timeout 5 node dist/index.js < /dev/null 2>&1 | head -10
# It should close without an error (empty output is fine)
```

---

## Performance

### Optimizations in Place

1. **CV cache**: loaded into memory once
2. **Pre-compiled regexes**: tech keywords are not recompiled
3. **Lazy evaluation**: projects are loaded only for ask_about_me or list_projects

### Benchmark

Run the benchmarks manually:

```bash
node -e "
import { performance } from 'perf_hooks';
import { loadCv } from './dist/lib/parser.js';
import { matchJob } from './dist/lib/matcher.js';

const start = performance.now();
const cv = loadCv('en');
const time1 = performance.now();
console.log('Load CV:', (time1 - start).toFixed(2), 'ms');

const start2 = performance.now();
const result = matchJob('Python developer with FastAPI', cv);
const time2 = performance.now();
console.log('Match job:', (time2 - start2).toFixed(2), 'ms');
"
```

### Reducing the Footprint

If the server feels slow:

1. **Clear the Node cache**:
```bash
rm -rf node_modules/.cache
```

2. **Use `--expose-gc` to debug memory**:
```bash
node --expose-gc dist/index.js
```

3. **Profile with Chrome DevTools**:
```bash
node --inspect dist/index.js &
# Open chrome://inspect
```

---

## Security

### Permissions

Make sure only the right user can read the data:

```bash
# The CV files should be readable by you
chmod 600 src/data/cv-*.md

# The projects file (can be more permissive)
chmod 640 src/data/projects.json

# Dist files
chmod 755 dist/index.js
chmod 644 dist/data/*
```

### Sensitive Data

The CV contains personal information. Never:
- Commit it to a public repo without review
- Share the MCP server's path without permission
- Log the complete CV for debugging

### Environment

No environment variables are needed. All the data is static.

---

## Running in Production

### Pre-Deploy Checklist

```bash
# 1. Lint
npm run lint
# Should pass with no errors

# 2. Build
npm run build
# Should complete with no warnings

# 3. Check the data files
ls -la dist/data/
# There should be 3 files

# 4. Test the tools
npm run inspect
# Test each tool manually

# 5. Check the build size
du -sh dist/
# Should be < 500KB (excluding node_modules)
```

### Monitoring in Production

If you run it as a service (systemd, pm2, and so on):

```bash
# pm2 example
pm2 start "node dist/index.js" --name "mcp-me" --log-date-format "YYYY-MM-DD HH:mm:ss"

# View logs
pm2 logs mcp-me

# Statistics
pm2 monit
```

### Troubleshooting in Production

If the MCP server crashes:

1. **Check the logs**:
```bash
pm2 logs mcp-me --lines 50
```

2. **Restart**:
```bash
pm2 restart mcp-me
```

3. **If the crash persists**:
```bash
# Rebuild
npm run build

# Restart with a reload
pm2 restart mcp-me --force
```

### Updating in Production

When syncing the CVs or projects:

```bash
# 1. Copy the data
cp ~/Development/cv/cv-*.md src/data/

# 2. Rebuild
npm run build

# 3. Restart (no downtime if you use pm2)
pm2 restart mcp-me
```

---

## Quick Runbooks

### "I want to test a tool"
```bash
npm run inspect
# A web UI opens; test interactively
```

### "I updated the CV"
```bash
cp ~/Development/cv/cv-en.md src/data/
npm run build
# The server reloads automatically
```

### "I added a project"
```bash
vim src/data/projects.json
# Edit and save

npm run build
npm run inspect
# Test list_projects
```

### "I got a 'Data file not found' error"
```bash
npm run build
ls dist/data/
# There should be 3 files

# If not:
cp src/data/* dist/data/
chmod 644 dist/data/*
```

### "A tool doesn't show up in the client"
```bash
npm run inspect
# See whether it appears at http://localhost:3000

# If not:
npm run lint:fix
npm run build
# Restart the MCP client (Claude Desktop)
```

### "I want to clear the CV cache"
```bash
# The cache only exists at runtime
# A restart is enough:
# Restart the server
# Or in dev: Ctrl+C and npm run dev
```

---

## Quick Command Reference

| Task | Command |
|------|---------|
| Build | `npm run build` |
| Dev with watch | `npm run dev` |
| Lint | `npm run lint` |
| Auto-fix lint | `npm run lint:fix` |
| Test with a GUI | `npm run inspect` |
| Sync the CVs | `cp ~/Development/cv/cv-*.md src/data/` |
| Validate the projects JSON | `jq '.' src/data/projects.json > /dev/null` |
| Check the data files | `ls -la dist/data/` |
| Parse the CV manually | `node -e "import { loadCv } from ..."` |
