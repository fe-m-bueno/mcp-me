# mcp-me

## Sobre o Projeto

Servidor MCP pessoal que transforma dados profissionais em tools consumíveis por LLMs. Em vez de um recrutador ler um PDF, ele (ou um agente) pergunta e o servidor responde com dados reais estruturados. Puxa dados de arquivos locais (CVs em Markdown) e de um arquivo de projetos como fonte de verdade.

## Stack

- **Runtime:** Node.js (TypeScript)
- **Protocolo:** MCP SDK (`@modelcontextprotocol/sdk`)
- **Build:** tsup
- **Linting:** Biome

## Estrutura

```
mcp-me/
├── src/
│   ├── index.ts              # Entry point — stdio transport
│   ├── server.ts             # Registro de tools no servidor MCP
│   ├── tools/
│   │   ├── cv.ts             # get_cv — retorna CV completo ou seções específicas
│   │   ├── projects.ts       # list_projects — projetos com stack, descrição, links
│   │   ├── match.ts          # match_job — recebe descrição de vaga, analisa fit
│   │   └── ask.ts            # ask_about_me — busca por keyword na experiência
│   ├── data/
│   │   ├── cv-en.md          # CV em inglês (synced do repo cv/)
│   │   ├── cv-ptbr.md        # CV em português (synced do repo cv/)
│   │   └── projects.json     # Dados expandidos dos projetos (links, demos, highlights)
│   └── lib/
│       ├── parser.ts         # Parse dos markdowns em estrutura navegável
│       └── matcher.ts        # Lógica de matching vaga ↔ perfil
├── tsconfig.json
├── package.json
├── biome.json
└── CLAUDE.md
```

## Tools MCP

| Tool | Input | Output |
|------|-------|--------|
| `get_cv` | `{ lang?: "en" \| "pt-br", section?: string }` | CV completo ou seção específica (resumo, skills, experiência, etc.) |
| `list_projects` | `{ tech?: string }` | Projetos filtráveis por tecnologia, com descrição, stack e links |
| `match_job` | `{ description: string }` | Análise de fit: skills que batem, gaps, score, sugestão de pitch |
| `ask_about_me` | `{ question: string }` | Busca por keyword/contexto nas experiências e retorna trechos relevantes |

## Dados

- CVs em Markdown são a fonte de verdade — ficam em `src/data/` copiados do repo `~/Development/cv/`
- `projects.json` expande os projetos do CV com campos extras: repo URL, demo URL, highlights técnicos, status
- O parse do Markdown divide o CV em seções navegáveis (headings H2 como chave)

## Convenções

- Output das tools em **texto natural estruturado**, não JSON cru — LLMs consomem melhor
- `match_job` deve ser honesto: listar gaps reais, não inflar o perfil
- Código em inglês, outputs bilíngues conforme `lang`
- Zero dependências além de MCP SDK — parse de Markdown feito na mão (é simples)
- Sem over-engineering: começar com keyword matching simples no `ask_about_me`, sem embeddings

## Comandos

```bash
npm install          # Instalar dependências
npm run build        # Build com tsup
npm run dev          # Dev mode com watch
npm run lint         # Lint com Biome
npm run inspect      # Testar com MCP Inspector
```

## Configuração no cliente MCP

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
