# Runbook: mcp-me

Guia operacional para troubleshooting, manutenção, debugging e operações comuns.

## Sumário

1. [Troubleshooting](#troubleshooting)
2. [Manutenção de dados](#manutenção-de-dados)
3. [Debugging](#debugging)
4. [Logs e Monitoring](#logs-e-monitoring)
5. [Performance](#performance)
6. [Segurança](#segurança)
7. [Desempenho em produção](#desempenho-em-produção)

---

## Troubleshooting

### Problema: "Data file not found"

Quando qualquer tool retorna este erro.

**Causa raiz:**
- Build não foi executado
- Arquivos em `src/data/` não foram copiados para `dist/data/`
- Caminho absolutodo `dist/` está incorreto no cliente MCP

**Solução:**

1. Verifique se build foi executado:
```bash
ls dist/data/
# Deve listar: cv-en.md, cv-ptbr.md, projects.json
```

2. Se não existir, rode o build:
```bash
npm run build
```

3. Verifique permissões:
```bash
stat dist/data/cv-en.md
# Deve ser readable
chmod 644 dist/data/*
```

4. No cliente MCP, confirme o path absoluto:
```bash
# macOS/Linux
cat ~/.config/Claude/claude_desktop_config.json | jq '.mcpServers.me.args[0]'
# Deve ser um path absoluto que existe

# Teste se o path existe
ls /home/felipebueno/Development/mcp-me/dist/index.js
```

---

### Problema: Tool não aparece disponível no cliente

Quando `get_cv`, `list_projects`, etc. não aparecem na lista de tools.

**Causa raiz:**
- Servidor não inicializou corretamente
- Transport stdio não conectou
- Cliente não viu a resposta de capabilities

**Solução:**

1. Teste manualmente:
```bash
npm run inspect
# Abre MCP Inspector em http://localhost:3000
# Deve listar 4 tools sob "Models"
```

2. Se Inspector não funcionar, verifique stderr:
```bash
node dist/index.js 2>&1 | head -20
# Se houver erro, aparecerá aqui
```

3. Teste com eco:
```bash
# Terminal 1
node dist/index.js

# Terminal 2: simule handshake MCP
cat <<'EOF' | node dist/index.js
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
EOF
```

4. Verifique se index.js foi compilado:
```bash
file dist/index.js
# Deve ser "JavaScript source"

head -1 dist/index.js
# Deve ter #!/usr/bin/env node (shebang)
```

5. No cliente MCP, reinicie:
```bash
# Claude Desktop: Quit + relaunch
# Cline: Reload window
```

---

### Problema: Tool retorna resultado vazio ou inesperado

Quando uma tool retorna dados inconsistentes.

**get_cv:**
```bash
# Teste com curl (simule chamada MCP)
npm run inspect
# No Inspector, teste com diferentes langs e sections

# Seção não encontrada?
curl -X POST http://localhost:3000/tool \
  -H "Content-Type: application/json" \
  -d '{"tool":"get_cv","args":{"section":"invalid"}}'
# Deve retornar lista de seções disponíveis com isError: true
```

**list_projects:**
```bash
# Teste filtro por tech
npm run inspect
# Tente "React", "Python", "Next.js"

# Nenhum projeto encontrado?
cat src/data/projects.json | jq '.[].tech' | sort -u
# Veja quais techs existem
```

**match_job:**
```bash
# Teste com job description real
npm run inspect
# Cole uma descrição de vaga

# Score baixo?
# - Verifique se skills do CV estão no "Technical Skills" section
# - Verifique se job description tem keywords de tech reconhecidas
```

**ask_about_me:**
```bash
# Teste com perguntas simples
npm run inspect
# "Python experience?"
# "React projects?"

# Sem resultados?
# - Pode ser stop word: tente keywords mais específicos
# - Verifique se a keyword aparece no CV/projetos
```

---

### Problema: Linting falha no build

Quando `npm run build` ou `npm run lint` falhando.

**Causa raiz:**
- Espaçamento inconsistente
- Imports desorganizados
- Unused variables

**Solução:**

```bash
# Auto-fix
npm run lint:fix

# Verifique o que foi mudado
git diff

# Se ainda falhar, veja detalhes
npm run lint
# Biome lista exatamente o que está errado
```

---

### Problema: Node.js version incompatível

Quando `node dist/index.js` falha com erro de sintaxe.

**Causa raiz:**
- Node.js < 22
- Versão incompatível com ES Modules

**Solução:**

```bash
# Verifique versão
node --version
# Deve ser v22.x.x ou superior

# Instale Node 22+
# Via nvm
nvm install 22
nvm use 22

# Ou via Homebrew (macOS)
brew install node@22

# Rebuild após upgrade
npm run build
```

---

### Problema: Porta 3000 já em uso (MCP Inspector)

Quando `npm run inspect` falha.

**Causa raiz:**
- Outro processo usando porta 3000
- Inspector anterior não encerrou

**Solução:**

```bash
# Verifique qual processo
lsof -i :3000
# Ou no Windows
netstat -ano | findstr :3000

# Encerre o processo
kill -9 <PID>
# Ou no Windows
taskkill /PID <PID> /F

# Tente novamente
npm run inspect
```

---

### Problema: CV ou projetos não atualizando

Quando você edita `src/data/` mas o servidor não vê mudanças.

**Causa raiz:**
- Cache em memória não foi limpo
- Dados não foram sincronizados do repo cv/
- Build não copiou dados novos

**Solução:**

```bash
# Se estiver em desenvolvimento (npm run dev)
# O watcher só recompila TypeScript, não copia dados

# Solução: Copie dados manualmente
cp ~/Development/cv/cv-en.md src/data/
cp ~/Development/cv/cv-ptbr.md src/data/

# Rebuild completo
npm run build

# Cache será zerado ao reiniciar o servidor
```

**Para projetos.json:**
```bash
# Edite diretamente
vim src/data/projects.json

# Rebuild
npm run build

# Se em dev mode, restart manual:
# Ctrl+C e rode npm run dev novamente
```

---

## Manutenção de Dados

### Sincronizar CVs do repo cv/

Os CVs são a fonte de verdade. Mantenha sincronizados.

```bash
# Verifique estrutura do repo cv/
ls ~/Development/cv/
# Deve ter: cv-en.md, cv-ptbr.md

# Sincronize
cp ~/Development/cv/cv-en.md /home/felipebueno/Development/mcp-me/src/data/
cp ~/Development/cv/cv-ptbr.md /home/felipebueno/Development/mcp-me/src/data/

# Verifique diffs
diff ~/Development/cv/cv-en.md /home/felipebueno/Development/mcp-me/src/data/cv-en.md

# Rebuild
cd /home/felipebueno/Development/mcp-me
npm run build
```

### Adicionar novo projeto

1. Edite `src/data/projects.json`:
```json
{
  "name": "Novo Projeto",
  "description": "Descrição concisa",
  "tech": ["Tech1", "Tech2"],
  "repo": "https://github.com/fe-m-bueno/repo-url",
  "demo": "https://demo.vercel.app",
  "highlights": [
    "Ponto técnico 1",
    "Ponto técnico 2"
  ],
  "status": "completed",
  "category": "cv"
}
```

2. Valide JSON:
```bash
cat src/data/projects.json | jq '.' > /dev/null && echo "OK"
```

3. Rebuild:
```bash
npm run build
```

4. Teste:
```bash
npm run inspect
# Em Projects, teste `list_projects({ tech: "Tech1" })`
```

### Atualizar seção de skills

1. Edite CV:
```bash
vim src/data/cv-en.md
# Procure por ## Technical Skills
# Atualize a lista
```

2. Formato esperado:
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

4. Teste matching:
```bash
npm run inspect
# Teste match_job com job description que inclui seus skills
```

---

## Debugging

### Ativar logs detalhados

Nenhum sistema de logs built-in. Use console.log manual ou Debug module.

```typescript
// Em lib/matcher.ts, por exemplo
import debug from 'debug';
const log = debug('mcp-me:matcher');

// Seu código
log('Extracting tech from description:', jobDescription);
```

Rode com:
```bash
DEBUG=mcp-me:* npm run dev
```

### Inspecionar estrutura parseada

Verifique se CV foi parseado corretamente:

```bash
node -e "
import { loadCv } from './dist/lib/parser.js';
const cv = loadCv('en');
console.log('Header:', cv.header);
console.log('Sections:', Array.from(cv.sections.keys()));
console.log('Skills sample:', cv.sections.get('Technical Skills')?.slice(0, 200));
" 2>&1
```

### Testar matching sem MCP

Teste `matchJob` diretamente:

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

### Testar parser de CV

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

## Logs e Monitoring

### Onde estão os logs?

Nenhum logging centralizado. Logs vão para stderr/stdout.

Em Claude Desktop, veja em:
```bash
# macOS
~/Library/Logs/Claude

# Windows
%APPDATA%/Claude/logs

# Linux (via Cline)
# Veja na aba "Output" do Cline
```

### Capturar stderr do servidor

Quando `node dist/index.js` está rodando como MCP server:

```bash
# No cliente MCP (Claude Desktop), abra o console do desenvolvedor
# Cmd+Shift+I (Windows/Linux) ou Cmd+Opt+I (macOS)
# Procure por "mcp-me" logs
```

### Health check do servidor

```bash
# Verifique se processo está rodando
ps aux | grep "mcp-me\|node dist/index.js"

# Teste se porta stdio funciona
timeout 5 node dist/index.js < /dev/null 2>&1 | head -10
# Deve fechar sem erro (output vazio é ok)
```

---

## Performance

### Otimizações implementadas

1. **Cache de CV**: Carregado uma única vez em memória
2. **Regex pré-compiladas**: Tech keywords não são recompiladas
3. **Lazy evaluation**: Projetos carregados só se ask_about_me ou list_projects

### Benchmark

Rode benchmarks manualmente:

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

### Reduzir footprint

Se servidor estiver lento:

1. **Limpe o cache Node**:
```bash
rm -rf node_modules/.cache
```

2. **Use `--expose-gc` para debugar memory**:
```bash
node --expose-gc dist/index.js
```

3. **Profile com Chrome DevTools**:
```bash
node --inspect dist/index.js &
# Acesse chrome://inspect
```

---

## Segurança

### Permissions

Certifique-se que apenas o usuário correto pode ler dados:

```bash
# CV files devem ser readable por você
chmod 600 src/data/cv-*.md

# Projects file (pode ser mais permissivo)
chmod 640 src/data/projects.json

# Dist files
chmod 755 dist/index.js
chmod 644 dist/data/*
```

### Dados sensíveis

O CV contém informações pessoais. Nunca:
- Commitar para repo público sem review
- Compartilhar path do MCP server sem permissão
- Logar completo CV para debug

### Environment

Nenhuma env var necessária. Todos os dados são estáticos.

---

## Desempenho em Produção

### Checklist pré-deploy

```bash
# 1. Lint
npm run lint
# Deve passar sem erros

# 2. Build
npm run build
# Deve completar sem warnings

# 3. Verifique data files
ls -la dist/data/
# Deve ter 3 arquivos

# 4. Teste tools
npm run inspect
# Teste cada tool manualmente

# 5. Verifique build size
du -sh dist/
# Deve ser < 500KB (sem node_modules)
```

### Monitoring em produção

Se rodar como serviço (systemd, pm2, etc.):

```bash
# pm2 example
pm2 start "node dist/index.js" --name "mcp-me" --log-date-format "YYYY-MM-DD HH:mm:ss"

# Ver logs
pm2 logs mcp-me

# Estatísticas
pm2 monit
```

### Troubleshooting em produção

Se MCP server crasha:

1. **Verifique logs**:
```bash
pm2 logs mcp-me --lines 50
```

2. **Restart**:
```bash
pm2 restart mcp-me
```

3. **Se crash persiste**:
```bash
# Reconstrua
npm run build

# Restart com reload
pm2 restart mcp-me --force
```

### Update em produção

Quando sincronizar CVs ou projetos:

```bash
# 1. Copie dados
cp ~/Development/cv/cv-*.md src/data/

# 2. Rebuild
npm run build

# 3. Restart (sem downtime se usar pm2)
pm2 restart mcp-me
```

---

## Runbooks Rápidos

### "Quero testar uma tool"
```bash
npm run inspect
# UI web se abre, teste interativamente
```

### "Atualizei o CV"
```bash
cp ~/Development/cv/cv-en.md src/data/
npm run build
# Server recarrega automaticamente
```

### "Adicionei um projeto"
```bash
vim src/data/projects.json
# Edite e salve

npm run build
npm run inspect
# Teste list_projects
```

### "Recebi erro 'Data file not found'"
```bash
npm run build
ls dist/data/
# Deve ter 3 arquivos

# Se não:
cp src/data/* dist/data/
chmod 644 dist/data/*
```

### "Tool não aparece no cliente"
```bash
npm run inspect
# Veja se aparece em http://localhost:3000

# Se não:
npm run lint:fix
npm run build
# Restart cliente MCP (Claude Desktop)
```

### "Quer deletar cache do CV"
```bash
# Cache só existe em runtime
# Restart é suficiente:
# Reinicie o servidor
# Ou em dev: Ctrl+C e npm run dev
```

---

## Referência Rápida de Comandos

| Tarefa | Comando |
|--------|---------|
| Build | `npm run build` |
| Dev com watch | `npm run dev` |
| Lint | `npm run lint` |
| Auto-fix lint | `npm run lint:fix` |
| Test com GUI | `npm run inspect` |
| Sincronizar CVs | `cp ~/Development/cv/cv-*.md src/data/` |
| Validar JSON projetos | `jq '.' src/data/projects.json > /dev/null` |
| Verifique data files | `ls -la dist/data/` |
| Parse CV manualmente | `node -e "import { loadCv } from ..."` |
