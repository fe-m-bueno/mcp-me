# Arquitetura do mcp-me

Documentação técnica detalhada sobre a arquitetura, design de módulos, fluxos de dados e decisões de design.

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cliente MCP (LLM/Agent)                     │
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

## Módulos e Responsabilidades

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

**Responsabilidades:**
- Inicializa o servidor MCP
- Configura transporte stdio (stdin/stdout)
- Conecta o servidor ao cliente via JSON-RPC

**Fluxo:**
1. Node.js inicia o processo
2. StdioServerTransport se prende aos canais de stdio do processo pai
3. Qualquer erro fatal é capturado e reportado ao stderr

---

### 2. **src/server.ts** — MCP Server & Tool Registry

Define as 4 tools MCP com descrições, schemas de input e handlers.

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

**Responsabilidades:**
- Definir schema de input de cada tool com Zod
- Definir título e descrição para descoberta do cliente
- Registrar handlers (callbacks) de cada tool
- Marcar tools como read-only com hints

**Hints de Segurança (READ_ONLY):**
```typescript
const READ_ONLY = {
  readOnlyHint: true,        // Não modifica estado
  destructiveHint: false,    // Não deleta dados
  idempotentHint: true,      // Sempre retorna o mesmo resultado
  openWorldHint: false,      // Não requer acesso aberto
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

**Fluxo:**
1. Valida linguagem (padrão: "en")
2. Carrega CV via `loadCv(lang)`
3. Se `section` definida:
   - Busca seção via `getSection(cv, section)`
   - Retorna seção ou lista de seções disponíveis se não encontrar
4. Caso contrário, retorna CV completo

**Matching de seção:**
1. Match exato
2. Match case-insensitive
3. Match parcial (substring)
4. Match via alias (ex: "skills" → "Technical Skills")

---

#### **projects.ts** — list_projects Handler

```typescript
export async function listProjectsHandler(args: {
  tech?: string;
}): Promise<ToolResponse>
```

**Fluxo:**
1. Carrega projetos via `loadProjects()`
2. Se `tech` definida, filtra por match case-insensitive
3. Formata cada projeto com helper `formatProject()`
4. Retorna lista ou erro com tecnologias disponíveis

**Formatação:**
```
### Project Name (Status)
**Stack:** Tech1, Tech2, Tech3
**Description:** Descrição
**Highlights:**
- Ponto 1
- Ponto 2
**Repo:** URL ou "Private"
**Demo:** URL (se houver)
```

---

#### **match.ts** — match_job Handler

```typescript
export async function matchJobHandler(args: {
  description: string;
}): Promise<ToolResponse>
```

**Fluxo:**
1. Carrega CV em inglês
2. Chama `matchJob(description, cv)` em `lib/matcher.ts`
3. Formata resultado estruturado com seções:
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

**Fluxo:**
1. Extrai keywords da pergunta via `extractKeywords()`
2. Filtra stop words (comum, genérico)
3. Busca matches em seções do CV
4. Busca matches em projetos
5. Ordena por relevância (contagem de keyword matches)
6. Agrupa por seção e retorna top 10

---

### 4. **src/lib/parser.ts** — CV Parser

Transforma Markdown em estrutura navegável.

```typescript
export interface CvData {
  raw: string;                    // Markdown original
  header: CvHeader;               // Nome, título, contato
  sections: Map<string, string>;  // H2 sections com conteúdo
}
```

**Algoritmo de parse:**
1. Divide Markdown em linhas
2. Busca H1 (`# Nome`)
3. Extrai header lines antes do primeiro `---`
4. Itera linhas após `---`, agrupando por H2 (`## Section`)
5. Armazena seções em Map para O(1) lookup

**Alias system:**
```typescript
const SECTION_ALIASES: Record<string, string[]> = {
  summary: ["Professional Summary", "Resumo Profissional"],
  skills: ["Technical Skills", "Competências Técnicas"],
  // ...
};
```

Permite buscar "summary" e encontrar "Professional Summary" ou "Resumo Profissional".

**Cache:**
```typescript
const cvCache = new Map<string, CvData>();

export function loadCv(lang: "en" | "pt-br"): CvData {
  const cached = cvCache.get(lang);
  if (cached) return cached;
  // carrega do disco apenas na primeira vez
  const cv = parseCv(readFileSync(...));
  cvCache.set(lang, cv);
  return cv;
}
```

---

### 5. **src/lib/matcher.ts** — Job Matching Engine

Analisa fit entre vaga e perfil.

```typescript
export interface MatchResult {
  score: number;                   // 0-100
  matchedSkills: string[];         // Skills presentes em ambas
  missingSkills: string[];         // Skills na vaga, não no CV
  relevantExperience: string[];    // Experiência alinhada
  suggestedPitch: string;          // Pitch calibrado ao score
}

export function matchJob(jobDescription: string, cv: CvData): MatchResult
```

**Componentes:**

#### **Tech Keywords Registry**
170+ tech keywords pré-compilados:
- Linguagens: JavaScript, Python, Java, Go, Rust, etc.
- Frameworks: React, Vue, Angular, Next.js, Django, FastAPI, etc.
- Bancos: PostgreSQL, MongoDB, Redis, DynamoDB, etc.
- DevOps: Docker, Kubernetes, Terraform, AWS, etc.
- Outros: GraphQL, REST, CI/CD, MCP, ETL, etc.

Cada keyword tem regex pré-compilada para matching rápido.

#### **extractCvSkills(cv)**
Parseia seção "Technical Skills" e extrai skills formatados como:
```markdown
**Frontend:** React, TypeScript, Tailwind CSS
**Backend:** Node.js, FastAPI, PostgreSQL
```

Resultado: `["React", "TypeScript", "Tailwind CSS", "Node.js", ...]`

#### **normalizeSkill(skill)**
Normaliza para matching:
- Lowercase
- Remove pontos, hífens, slashes
- Normaliza espaços

Exemplo: "Next.js" → "nextjs", "C#" → "c", "C++" → "c"

#### **skillsMatch(a, b)**
Verifica se skills são equivalentes com proteção contra falsos positivos:
- Requer tamanho mínimo (3 caracteres)
- Substring matching com threshold de 50%

Previne: "NET" de "ASP.NET" não matching com "Kubernetes".

#### **extractTechFromDescription(description)**
Busca todos os keywords de tech na job description usando regex pré-compiladas.

#### **extractExperienceBullets(cv)**
Extrai bullet points da seção "Professional Experience":
```markdown
- Desenvolveu sistema de chat com SSE e Redis
- Mentored 3 engineers na stack de Node.js
```

#### **Scoring Algorithm**

```typescript
// Fase 1: Matching de skills
for (const tech of jobTechKeywords) {
  // Busca em cvSkills com normalização
  if (encontrado) {
    matchedSkills.push(tech);
  } else {
    missingSkills.push(tech);
  }
}

// Fase 2: Extração de experiência relevante
const relevantExperience = extractExperienceBullets(cv)
  .map(bullet => ({
    bullet,
    relevance: contar_palavras_do_job_na_bullet(bullet)
  }))
  .filter(b => relevance >= 2)  // Min 2 palavras match
  .sort((a, b) => b.relevance - a.relevance)
  .slice(0, 5);  // Top 5

// Fase 3: Cálculo de score
let score = (matchedSkills.length / totalTechKeywords) * 100;
score += Math.min(relevantExperience.length * 2, 10);  // Bonus até 10 pontos
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

**Responsabilidades:**
- Carrega `projects.json` do disco
- Valida que é um array
- Cacheia em memória

Sem validação Zod strict, confia na estrutura do arquivo.

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

**Padrão:**
- Sucesso: `{ content: [{ type: "text", text: "..." }] }`
- Erro: `{ isError: true, content: [{ type: "text", text: "..." }] }`

**safeLoadCv** para carregamento defensivo:
```typescript
const result = safeLoadCv(() => loadCv("en"));
if (isErrorResponse(result)) return result;
const cv = result;  // garantido ser CvData
```

---

### 8. **src/lib/paths.ts** — Path Resolution

```typescript
export function dataPath(filename: string): string {
  return join(__dirname, "data", filename);
}
```

Resolve `src/data/` em tempo de build, `dist/data/` em runtime.

Usa `import.meta.url` para ES Modules.

---

### 9. **src/data/** — Data Files

#### **cv-en.md / cv-ptbr.md**
Markdown com estrutura:
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

Sincronizados do repo `~/Development/cv/`.

#### **projects.json**
Array JSON com estrutura extendida de projetos:
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

## Fluxos de Dados

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

## Decisões de Design

### 1. **Sem Over-engineering**
- Não usar embeddings (complicado, lento)
- Usar keyword matching simples
- Regex pré-compiladas para performance

### 2. **Bilíngue por design**
- Dois CVs completos (en/pt-br)
- Stop words em ambas línguas
- Alias em ambas línguas

### 3. **Outputs em texto natural**
- Não retornar JSON cru
- Markdown formatado legível
- Melhor consumido por LLMs

### 4. **Cache defensivo**
- Carregar dados uma única vez
- Mapas em memória para O(1) lookup
- Não refrescar durante runtime

### 5. **Validação Zod seletiva**
- Input dos handlers com Zod (CLI safety)
- Data files sem validação strict (confia no build)
- Falha rápido com erros claros

### 6. **Zero dependências extras**
- Apenas MCP SDK obrigatório
- Zod para validação (2 deps total)
- Tudo mais: Node.js stdlib

### 7. **Honestidade no matching**
- Reportar gaps reais
- Score calibrado com experiência
- Pitch ajustado ao fit real

---

## Padrões de Error Handling

### Try-Catch defensivo
```typescript
export function safeLoadCv<T>(loader: () => T): T | ToolResponse {
  try {
    return loader();
  } catch {
    return errorResult("Data file not found. Ensure the server was built.");
  }
}
```

### Validação de input
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

| Operação | Tempo | Notas |
|----------|-------|-------|
| Carregar CV (primeira vez) | ~5ms | Lê arquivo, parseia, cacheia |
| Carregar CV (cache) | <1ms | Map lookup |
| Match job | ~20-50ms | Regex em techs + extraction |
| Ask about me | ~10-30ms | Keyword matching, sorting |
| List projects | <5ms | Array filter, format |

---

## Testing & Debugging

### Estrutura de dados esperada

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

### Modo debug

```bash
# Print input args
export DEBUG=mcp-me:*
npm run dev

# Use MCP Inspector para ver requests/responses
npm run inspect
```

---

## Migração e Versioning

Versão: 1.0.0 (stable)

Não há versioning de data files. CVs são sincronizados manualmente. Projetos são editados inline.

Para futuras versões:
- Incrementar `version` em `server.ts` e `package.json`
- Changelog em CHANGELOG.md
- Deprecated tools mantidas com aviso
