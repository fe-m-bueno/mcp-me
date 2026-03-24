# Guia de Introdução: mcp-me

Um guia passo-a-passo para configurar, construir e usar o servidor MCP mcp-me pela primeira vez.

## Tabela de Conteúdos

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação](#instalação)
3. [Build](#build)
4. [Configuração](#configuração)
5. [Primeiro uso](#primeiro-uso)
6. [Próximos passos](#próximos-passos)

---

## Pré-requisitos

Antes de começar, certifique-se que tem instalado:

### Node.js 22+

```bash
# Verifique versão instalada
node --version
# Esperado: v22.x.x ou superior

# Se não tiver Node 22:
# Opção 1: usando nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22

# Opção 2: Homebrew (macOS)
brew install node@22
brew link node@22

# Opção 3: Instalador oficial
# https://nodejs.org/en/download/
```

### npm 10+

```bash
# npm é instalado com Node.js
# Verifique versão
npm --version
# Esperado: 10.x.x ou superior

# Se precisar atualizar
npm install -g npm@latest
```

### Git (opcional, para clonar repositório)

```bash
git --version
# Se não tiver, instale conforme seu OS
```

### Um cliente MCP (para usar o servidor)

Escolha um:
- **Claude Desktop** (recomendado): https://claude.ai/download
- **Cline (VS Code)**: https://github.com/cline/cline
- **Outra ferramenta com suporte MCP**

---

## Instalação

### Passo 1: Clone ou copie o repositório

**Via Git:**
```bash
git clone https://github.com/fe-m-bueno/mcp-me.git
cd mcp-me
```

**Ou manualmente:**
Baixe o zip do repositório, extraia e entre no diretório.

### Passo 2: Instale dependências

```bash
npm install
```

Espere alguns segundos. Você deve ver:
```
added 247 packages in 5.23s
```

### Passo 3: Verifique a instalação

```bash
npm --version
# npm 10.x.x

node --version
# v22.x.x

ls node_modules/@modelcontextprotocol
# Deve listar: sdk

ls node_modules/zod
# Deve existir
```

Se tudo está OK, prossiga para **Build**.

---

## Build

### Passo 1: Construa o projeto

```bash
npm run build
```

Você deve ver:
```
dist/index.js    30.1 kB
dist/index.d.ts  15.3 kB
```

**O que acontece:**
1. TypeScript é compilado para JavaScript (tsup)
2. Sourcemaps são gerados para debugging
3. Data files (CVs, projetos) são copiados para `dist/data/`

### Passo 2: Verifique o resultado

```bash
ls -la dist/
```

Você deve ver:
```
-rw-r--r-- index.js          (compilado)
-rw-r--r-- index.js.map      (sourcemap)
-rw-r--r-- index.d.ts        (types)
drwxr-xr-x data/             (CVs + projetos)
```

```bash
ls -la dist/data/
```

Você deve ver:
```
-rw-r--r-- cv-en.md       (CV em inglês)
-rw-r--r-- cv-ptbr.md     (CV em português)
-rw-r--r-- projects.json  (dados de projetos)
```

### Passo 3: Teste a build

```bash
node dist/index.js &
# Processa inicia em background

sleep 1
echo "Build OK"
kill %1
```

Se nenhum erro aparecer, a build funcionou!

---

## Configuração

### Passo 1: Localize seu arquivo de configuração

O caminho depende do seu cliente MCP.

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
Você configura direto nas settings do VS Code: `Cline > MCP Servers`

### Passo 2: Obtenha o caminho absoluto

Você precisa do caminho completo até `dist/index.js`.

```bash
# No diretório do mcp-me:
pwd
# Saída exemplo: /home/felipebueno/Development/mcp-me

# Combine com dist/index.js:
echo "$(pwd)/dist/index.js"
# Saída: /home/felipebueno/Development/mcp-me/dist/index.js
```

**Windows (PowerShell):**
```powershell
(Get-Location).Path + "\dist\index.js"
# Saída: C:\Users\felipebueno\Development\mcp-me\dist\index.js
```

### Passo 3: Configure o cliente

#### Claude Desktop

Edite ou crie `~/.config/Claude/claude_desktop_config.json`:

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
1. Abra Command Palette: `Cmd+Shift+P` (macOS) ou `Ctrl+Shift+P`
2. Procure por "Cline: Open MCP Server Settings"
3. Adicione entrada:
```json
{
  "me": {
    "command": "node",
    "args": ["/home/felipebueno/Development/mcp-me/dist/index.js"]
  }
}
```

### Passo 4: Reinicie seu cliente

- **Claude Desktop:** Quit (Cmd+Q) e reabra
- **Cline:** Reload Window (Cmd+R ou F5)
- **Outro cliente:** Restart conforme necessário

---

## Primeiro Uso

### Teste 1: Verifique se as tools estão disponíveis

**Claude Desktop:**
1. Abra uma nova conversa
2. Clique no ícone de ferramentas (wrench) na barra inferior
3. Você deve ver 4 tools listadas:
   - `get_cv`
   - `list_projects`
   - `match_job`
   - `ask_about_me`

**Se não aparecerem:**
- Verifique o path em `claude_desktop_config.json`
- Certifique-se que `npm run build` foi executado
- Restart Claude Desktop completamente

### Teste 2: Chame `get_cv`

Na conversa do Claude, peça:

```
Me mostre o CV em português da seção de Habilidades Técnicas
```

Claude deve usar a tool `get_cv` e retornar a seção de skills em português.

**Esperado:**
```
## Technical Skills / Competências Técnicas (Portuguese)

**Frontend:** React, Next.js, TypeScript, TailwindCSS, ...
**Backend:** Node.js, Python, FastAPI, ...
...
```

### Teste 3: Chame `list_projects`

Peça:

```
Que projetos com React ele tem?
```

Claude deve usar `list_projects` e retornar projetos filtrados por React.

**Esperado:**
```
## Felipe Bueno's Projects (filtered by: React)

Found X project(s):

### Project Name (Status)
**Stack:** React, Next.js, TypeScript, ...
**Description:** Descrição do projeto
**Highlights:**
- Ponto técnico 1
- Ponto técnico 2
**Repo:** https://github.com/...
**Demo:** https://demo.vercel.app
```

### Teste 4: Chame `match_job`

Peça:

```
Analise se o perfil dele bate com essa vaga:

Senior React engineer with 5+ years building user-facing applications.
Must know Next.js, TypeScript, PostgreSQL. Bonus: GraphQL, Docker.
```

Claude deve usar `match_job` e retornar análise detalhada.

**Esperado:**
```
## Job Fit Analysis for Felipe Bueno

**Fit Score: 85/100**

### Matching Skills (5)
React, TypeScript, Next.js, Docker, GraphQL

### Gaps (1)
PostgreSQL

### Relevant Experience
- Desenvolveu aplicação X com React e Next.js...
- Mentored equipe em TypeScript...

### Suggested Pitch
Felipe is a strong fit for this role, bringing hands-on experience with...
```

### Teste 5: Chame `ask_about_me`

Peça:

```
Ele tem experiência com arquitetura de microserviços?
```

Claude deve usar `ask_about_me` para buscar informações.

**Esperado:**
```
Based on the question "microservices architecture", here are relevant details about Felipe:

**From Professional Experience:**
- Designed microservices architecture for...
- Implemented event-driven microservices with...

**From Projects:**
- **Project Name** (Tech1, Tech2) — Ponto técnico; Outro ponto
```

---

## Próximos Passos

### 1. Explore as tools mais profundamente

Agora que está funcionando, teste casos de uso reais:

```
"Does he have machine learning experience?"
"Qual stack ele usa para backend?"
"Que banco de dados ele conhece melhor?"
"Match com essa vaga de Data Engineer..."
```

### 2. Integre em seu workflow

Se você é um recrutador ou agente:

- Use `ask_about_me` para perguntas específicas
- Use `match_job` para analisar vagas automaticamente
- Combine `get_cv` e `list_projects` para visão holística

### 3. Customize para seu caso

Se quiser adaptar para seu próprio perfil:

1. **Atualize o CV:**
   - Edite ou copie seu próprio CV para `src/data/cv-en.md`
   - Mantenha o formato Markdown com ## sections

2. **Atualize os projetos:**
   - Edite `src/data/projects.json` com seus projetos

3. **Rebuild:**
   ```bash
   npm run build
   ```

4. **Reinicie o servidor:**
   - Restart Claude Desktop ou seu cliente

### 4. Desenvolvimento local

Se quiser fazer mudanças no código:

```bash
# Inicie dev mode com watch
npm run dev

# Em outro terminal, teste
npm run inspect
# Abre GUI em http://localhost:3000
```

Edite código em `src/`, a build recompila automaticamente.

### 5. Próximos recursos

Ideias para expansão futura:

- **Tool nova:** `get_timeline` — experiência em ordem cronológica
- **Tool nova:** `recommend_roles` — vagas recomendadas baseado em perfil
- **Integração:** LinkedIn API para stats
- **Dashboard:** Analytics de perguntas mais comuns

---

## Troubleshooting Rápido

### "Tools não aparecem"

```bash
# 1. Verifique path
cat ~/.config/Claude/claude_desktop_config.json | grep args

# 2. Verifique arquivo existe
ls /home/felipebueno/Development/mcp-me/dist/index.js

# 3. Rebuild
npm run build

# 4. Restart Claude Desktop (Cmd+Q + reabra)
```

### "Data file not found"

```bash
# Rode build completo
npm run build

# Verifique data files foram copiados
ls dist/data/
# Deve ter 3 arquivos

# Se não:
cp src/data/* dist/data/
```

### "Tool retorna erro"

Verifique se está usando argumentos corretos:

```
get_cv: { lang?: "en" | "pt-br", section?: string }
list_projects: { tech?: string }
match_job: { description: string }  (obrigatório)
ask_about_me: { question: string }
```

### "Linting ou build falhando"

```bash
# Auto-fix
npm run lint:fix

# Rebuild
npm run build
```

---

## Documentação Relacionada

Agora que está tudo funcionando:

- **README.md** — Visão geral do projeto e referência de tools
- **ARCHITECTURE.md** — Arquitetura técnica e fluxos de dados
- **RUNBOOK.md** — Troubleshooting, debugging e manutenção

---

## Suporte

Se encontrar problemas:

1. **Verifique RUNBOOK.md** seção Troubleshooting
2. **Verifique logs:**
   ```bash
   # Teste manualmente o servidor
   node dist/index.js 2>&1 | head -20
   ```
3. **Teste com MCP Inspector:**
   ```bash
   npm run inspect
   # Abre GUI em http://localhost:3000
   ```

---

## Checklist Final

Você completou com sucesso se:

- [ ] Node.js 22+ instalado
- [ ] Repositório clonado ou copiado
- [ ] `npm install` executado
- [ ] `npm run build` completado sem erros
- [ ] Cliente MCP configurado com path correto
- [ ] 4 tools aparecem no cliente
- [ ] `get_cv` retorna dados
- [ ] `list_projects` retorna dados
- [ ] `match_job` funciona com job description
- [ ] `ask_about_me` funciona com perguntas

Parabéns! Você está pronto para usar o mcp-me.

---

## Próxima Leitura Recomendada

1. **README.md** — Entenda todas as tools e seus usos
2. **ARCHITECTURE.md** — Saiba como tudo funciona internamente
3. **RUNBOOK.md** — Quando precisar debugar ou manter

Happy prompting!
