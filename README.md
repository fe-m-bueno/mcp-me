# mcp-me: Servidor MCP Pessoal

Um servidor [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) que transforma dados profissionais em ferramentas consumíveis por LLMs. Em vez de um recrutador ler um PDF estático de CV, ele (ou um agente) faz perguntas e recebe dados reais e estruturados em resposta.

**Status:** Produção | **Versão:** 1.0.0 | **Runtime:** Node.js + TypeScript

## Visão Geral

O mcp-me expõe 4 ferramentas MCP que consultam:

- **CVs bilíngues** (EN / PT-BR) em Markdown como fonte de verdade
- **Dados de projetos** expandidos (repositório, demo, destaques técnicos, status)
- **Análise de fit** vaga ↔ perfil com matching de skills
- **Busca por palavras-chave** em toda a experiência profissional

Ideal para:
- Agentes de recrutamento que analisam vagas automaticamente
- LLMs que precisam de dados biográficos estruturados
- Assistentes pessoais que respondem a perguntas sobre experiência
- Automação de análises de compatibilidade vaga-candidato

## Características

- Suporte completo a Inglês e Português Brasileiro
- Apenas 2 dependências (MCP SDK + Zod)
- TypeScript strict com validação Zod
- Carregamento eficiente na memória
- Markdown parseado manualmente
-  `match_job` reporta gaps reais, não infla o perfil
-  Texto natural estruturado, não JSON cru

## Ferramentas MCP

### 1. `get_cv`

Retorna o CV completo ou uma seção específica.

**Entrada:**
```json
{
  "lang": "en" | "pt-br",  // opcional, padrão: "en"
  "section": "summary" | "skills" | "experience" | "projects" | "education" | "certifications" | "languages"  // opcional
}
```

**Saída:** Texto Markdown formatado com o CV ou seção solicitada.

**Exemplos de uso:**
```
get_cv({ lang: "pt-br" })
→ Retorna CV completo em português

get_cv({ lang: "en", section: "skills" })
→ Retorna apenas a seção de habilidades técnicas em inglês

get_cv({ section: "professional experience" })
→ Match parcial: retorna a seção de experiência
```

---

### 2. `list_projects`

Lista projetos com metadados completos: descrição, stack, destaques, URL do repositório, URL da demo e status.

**Entrada:**
```json
{
  "tech": "Next.js" | "Python" | "React" | ...  // opcional, case-insensitive, partial match
}
```

**Saída:** Lista formatada de projetos com campos estruturados.

**Status:** `"completed"` | `"in-progress"` | `"active"` | `"experimental"`
**Categoria:** `"cv"` (em destaque no CV) | `"additional"` (extras no GitHub)

**Exemplos de uso:**
```
list_projects()
→ Lista todos os 8+ projetos

list_projects({ tech: "next" })
→ Filtra projetos com Next.js, retorna 2-3 resultados

list_projects({ tech: "python" })
→ Filtra projetos com Python, retorna projetos de IA/dados
```

---

### 3. `match_job`

Analisa o fit entre o perfil e uma descrição de vaga. Retorna:
- **Fit Score** (0-100): percentual de skills técnicas do job description presentes no CV
- **Matching Skills**: skills presentes em ambas as partes
- **Gaps**: skills necessários que não estão no CV
- **Relevant Experience**: trechos de experiência profissional alinhados com a vaga
- **Suggested Pitch**: avaliação honesta calibrada ao score

**Entrada:**
```json
{
  "description": "Fullstack Engineer needed for Next.js/React + Python FastAPI microservices..."
}
```

**Saída:** Análise estruturada com score, skills matching, gaps e pitch.

**Score interpretation:**
- **70-100:** Fit forte — candidato tem alinhamento claro com a vaga
- **40-69:** Fit parcial — há sobreposição, mas gaps significativos
- **0-39:** Fit baixo — seria pivô de carreira, não próximo passo natural

**Exemplos:**
```
match_job({ description: "React + TypeScript + Node.js backend engineer needed..." })
→ Score: 92, Matching Skills: React, TypeScript, Node.js, ...
→ Gaps: (nenhum), Suggested Pitch: Strong fit...

match_job({ description: "Lead Golang architect, 10 years Go experience required..." })
→ Score: 15, Matching Skills: (nenhum), Gaps: Go, Kubernetes orchestration, ...
→ Suggested Pitch: Limited overlap, significant career pivot...
```

---

### 4. `ask_about_me`

Busca por palavras-chave em todo o perfil (CV + projetos) e retorna os 10 trechos mais relevantes agrupados por seção.

**Entrada:**
```json
{
  "question": "ETL experience?" | "databases usados?" | "tem experiência com IA?" | ...
}
```

**Saída:** Trechos de experiência agrupados por seção (Professional Experience, Projects, etc.)

**Suporta:**
- Palavras-chave em inglês e português
- Busca por tecnologia, role, conceito
- Filtro de stop words para evitar ruído

**Exemplos:**
```
ask_about_me({ question: "ETL experience" })
→ Retorna experiência com pipelines de dados, Airflow, etc.

ask_about_me({ question: "tem experiência com IA?" })
→ Retorna projetos e experience com LLMs, CrewAI, etc.

ask_about_me({ question: "Docker Kubernetes" })
→ Retorna seções sobre DevOps, containerização, orquestração
```

---

## Stack

| Componente | Tecnologia |
|-----------|-----------|
| **Runtime** | Node.js 22+ (ES Modules) |
| **Linguagem** | TypeScript 5.7 |
| **Protocolo** | MCP SDK `@modelcontextprotocol/sdk` ^1.12.1 |
| **Validação** | Zod `^3.25.67` |
| **Build** | tsup 8.0 |
| **Linting** | Biome 1.9 |
| **Transporte** | stdio (comunicação padrão stdin/stdout) |

## Instalação

### Pré-requisitos
- **Node.js 22+** (verifiquecom `node --version`)
- **npm 10+** (ou yarn/pnpm)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/fe-m-bueno/mcp-me.git
cd mcp-me

# 2. Instale dependências
npm install

# 3. Build
npm run build

# 4. Verifique a build
ls dist/
# Deve haver: index.js, index.d.ts (sourcemaps), data/ (CVs + projetos)
```

### Estrutura pós-build

```
dist/
├── index.js           # Entry point compilado
├── index.js.map       # Sourcemap
├── index.d.ts         # Tipos TypeScript
└── data/
    ├── cv-en.md       # CV em inglês
    ├── cv-ptbr.md     # CV em português
    └── projects.json  # Dados de projetos
```

## Uso

### Como Servidor MCP (no cliente)

Configure no seu cliente MCP (Claude Desktop, Cline, etc.):

**macOS/Linux - `~/.config/Claude/claude_desktop_config.json`:**
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

**Windows - `%APPDATA%/Claude/claude_desktop_config.json`:**
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

Após configurar, reinicie o cliente MCP. As 4 ferramentas aparecerão disponíveis.

### Teste local com MCP Inspector

```bash
npm run inspect
```

Abre uma interface web em `http://localhost:3000` para testar as tools interativamente.

### Teste com Node.js direto

```bash
# Terminal 1: Inicia o servidor
node dist/index.js

# Terminal 2: Conecta via stdio
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/index.js
```

## Desenvolvimento

### Estrutura do código

```
src/
├── index.ts              # Entry point, stdio transport
├── server.ts             # Definição das 4 tools com descrições
├── tools/
│   ├── cv.ts             # Handler get_cv
│   ├── projects.ts       # Handler list_projects
│   ├── match.ts          # Handler match_job
│   └── ask.ts            # Handler ask_about_me
├── lib/
│   ├── parser.ts         # Parse de Markdown em seções
│   ├── matcher.ts        # Lógica de matching vaga ↔ perfil
│   ├── projects.ts       # Loading de projects.json
│   ├── response.ts       # Utilitários de resposta (ToolResponse)
│   └── paths.ts          # Resolução de caminhos de data/
└── data/
    ├── cv-en.md          # CV em inglês
    ├── cv-ptbr.md        # CV em português
    └── projects.json     # Dados de projetos com metadados
```

### Workflow de desenvolvimento

```bash
# 1. Desenvolva com watch
npm run dev

# 2. Lint em tempo real
npm run lint
npm run lint:fix

# 3. Build final
npm run build

# 4. Teste com Inspector
npm run inspect
```

### Adicionar uma nova tool

1. Crie `src/tools/new-tool.ts` com handler assíncrono
2. Registre em `server.ts` com `server.registerTool()`
3. Export no `index.ts` (já feito automaticamente)
4. Rebuild e teste via `npm run inspect`

**Exemplo:**
```typescript
// src/tools/new-tool.ts
import { loadCv } from "../lib/parser.js";
import { ToolResponse, textResult } from "../lib/response.js";

export async function newToolHandler(args: {
  query: string;
}): Promise<ToolResponse> {
  const cv = loadCv("en");
  // sua lógica aqui
  return textResult("resultado");
}
```

### Atualizar dados

**CVs:** Copie de `~/Development/cv/` para `src/data/cv-*.md`

```bash
cp ~/Development/cv/cv-en.md src/data/
cp ~/Development/cv/cv-ptbr.md src/data/
npm run build
```

**Projetos:** Edite `src/data/projects.json` diretamente

```bash
vim src/data/projects.json
npm run build
```

## Configuração

### Variáveis de Ambiente

Nenhuma necessária no momento. Todos os dados são estáticos em `src/data/`.

### Diretório de dados

O servidor busca dados em `src/data/` em tempo de build (resolvido via `lib/paths.ts`). Durante runtime, os arquivos estão em `dist/data/`.

### TypeScript/Zod

**tsconfig.json:**
- Target: ES2022
- Module: Node16 (ESM)
- Strict mode habilitado
- Resolução JSON habilitada

**biome.json:**
- Formatter: tabs (indentação)
- Linter: recommended rules
- Organize imports: enabled

## Performance e Optimizações

### Cache em memória

CVs e projetos são carregados uma única vez ao iniciar e guardados em cache:

```typescript
const cvCache = new Map<string, CvData>();
export function loadCv(lang: "en" | "pt-br"): CvData {
  const cached = cvCache.get(lang);
  if (cached) return cached;
  // carrega do disco, cacheia
}
```

### Matching eficiente

- Regex pré-compiladas para keywords de tech (`TECH_PATTERNS`)
- Normalização de skills com regras simples (lowercase, remover . - /)
- Filtragem de stop words no `ask_about_me`

### Tamanho mínimo

- Sem dependências extras (apenas MCP SDK + Zod)
- Parsing manual sem bibliotecas
- Bundle: ~200KB minificado

## Troubleshooting

### "Data file not found"

Certifique-se que você rodou `npm run build`. O build copia `src/data/` para `dist/data/`.

```bash
npm run build
ls dist/data/
```

### Tool retorna erro indefinido

Verifique se o path absoluto no `claude_desktop_config.json` está correto:

```bash
ls /home/felipebueno/Development/mcp-me/dist/index.js
# Deve existir
```

### MCP Inspector não abre

Porta 3000 pode estar em uso. Mude a porta ou encerre o processo:

```bash
lsof -i :3000
kill -9 <PID>
npm run inspect
```

### Linting falhando

```bash
npm run lint:fix
```

Biome corrige automaticamente problemas de formatting e imports.

## Contribuição

Este é um projeto pessoal, mas se quiser melhorias:

1. Faça um fork
2. Crie uma branch para sua feature (`git checkout -b feature/meu-feature`)
3. Commit as mudanças (`git commit -m "Adiciona X"`)
4. Push para a branch (`git push origin feature/meu-feature`)
5. Abra um Pull Request

## Contato

**Felipe Bueno**
GitHub: [@fe-m-bueno](https://github.com/fe-m-bueno)
Email: felipebueno.dev@gmail.com

