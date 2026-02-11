# PKP - Contexto de Desenvolvimento

**Projeto:** Product Knowledge Protocol (PKP)
**Autor:** Pedro / Kodda.ai
**Versao:** v0.3.2
**Ultima Atualizacao:** 2026-02-11
**GitHub:** https://github.com/koddaai/pkp
**Landing:** https://pkp.kodda.ai
**Docs:** https://pkp.kodda.ai/docs/
**Studio:** https://pkp-studio.vercel.app
**npm:** https://www.npmjs.com/org/pkprotocol

---

## Resumo do Projeto

O PKP e um **formato aberto + schemas por categoria** para representar conhecimento de produto de forma que qualquer AI agent possa consumir. E a camada que falta no stack de agentic commerce - resolve "o que comprar e por que" antes de AP2 (pagamento) e UCP (transacao).

### Proposta de Valor
- **Web-native:** Dados ficam em `/.well-known/pkp/` no dominio do fornecedor
- **Agent-first:** Funciona antes da adocao por fornecedores (bootstrap com AI)
- **Confidence explicita:** Cada bloco tem level + source + verified_at
- **Comparavel por design:** Schemas por categoria garantem comparabilidade

---

## Arquitetura (3 Camadas)

```
CAMADA 0 - Estatico (arquivo no servidor)
├── /pkp.txt                        → Ponteiro (opcional)
├── /.well-known/pkp/catalog.json   → indice L0
├── /.well-known/pkp/products/*.md  → PRODUCT.md
├── Acesso: HTTP GET
├── Custo: zero
└── Quem pode fazer: qualquer um com dominio

CAMADA 1 - Catalog MCP Server (@pkprotocol/catalog-server) ✅
├── Serve dados PKP via MCP protocol
├── Tools: search, compare, filter, faq, alternatives
├── Resources: pkp://catalog, pkp://product/{sku}
├── Acesso: MCP client (Claude Desktop, etc)
└── Quem faz: Kodda (managed) ou self-hosted

CAMADA 2 - Registry MCP Server (@pkprotocol/registry-server) ✅
├── Indexa /.well-known/pkp/ de multiplos dominios
├── Busca cross-dominio (search_products)
├── Tools: register, refresh, resolve, compare_across_catalogs
├── Acesso: MCP ou REST API
└── Quem faz: Kodda (e o negocio)
```

---

## Estrutura do Monorepo

```
pkp/
├── packages/
│   ├── spec/                  ✅ Formato PKP (schemas, parser, validador)
│   ├── shared/                ✅ Codigo compartilhado (slugify)
│   ├── static-generator/      ✅ Gera /.well-known/pkp/
│   ├── cli/                   ✅ CLI (validate, build, serve, generate)
│   ├── catalog-server/        ✅ MCP Server (Camada 1)
│   ├── registry-server/       ✅ Registry (Camada 2)
│   ├── skills/                ✅ Agent Skills
│   └── studio/                ✅ Interface web (Next.js)
├── examples/
│   └── kodda-catalog/         ✅ 10 produtos de exemplo
├── migrations/                ✅ SQL migrations (PostgreSQL)
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Packages Implementados

| Package | Status | Descricao |
|---------|--------|-----------|
| `@pkprotocol/spec` | ✅ | Schemas Zod, parser, validator, 111 testes |
| `@pkprotocol/shared` | ✅ | Utilitarios (slugify) |
| `@pkprotocol/static-generator` | ✅ | Gera .well-known/pkp/ de PRODUCT.md |
| `@pkprotocol/cli` | ✅ | init, validate, build, serve, generate |
| `@pkprotocol/catalog-server` | ✅ | MCP server para catalogos locais |
| `@pkprotocol/registry-server` | ✅ | MCP server para registry global + PostgreSQL |
| `@pkprotocol/skills` | ✅ | Prompts especializados para AI |
| `@pkprotocol/studio` | ✅ | Interface web para gerenciar catalogos (Next.js) |

---

## Instalacao via npm

```bash
# CLI global
npm install -g @pkprotocol/cli

# Packages individuais
npm install @pkprotocol/spec
npm install @pkprotocol/catalog-server
npm install @pkprotocol/registry-server
npm install @pkprotocol/skills
```

---

## CLI Commands

```bash
pkp init [dir]              # Inicializa novo catalogo PKP
pkp validate <path>         # Valida arquivos PRODUCT.md
pkp build [dir]             # Gera .well-known/pkp/
pkp serve [dir]             # Servidor local para testes
pkp generate -u <url> [-c category]  # Gera PRODUCT.md via AI (categoria auto-detectada)
pkp stats [dir]             # Estatisticas do catalogo
pkp diff <file1> <file2>    # Compara dois PRODUCT.md
pkp publish <target>        # Publica catalogo para diretorio
```

### pkp generate (AI Generation)

Gera arquivos PRODUCT.md automaticamente a partir de URLs de produtos usando Claude API.

```bash
# Requer ANTHROPIC_API_KEY
export ANTHROPIC_API_KEY=sk-ant-...

# Gerar de uma URL (categoria auto-detectada)
pkp generate -u https://loja.com/produto

# Com categoria especifica
pkp generate -u https://loja.com/produto -c notebooks

# Com opcoes adicionais
pkp generate -u https://loja.com/iphone -c celulares/smartphones -b Apple -o iphone.md -v

# Batch mode - processar multiplas URLs
pkp generate --file urls.txt -c notebooks -d ./products -n 5
```

**Auto-deteccao de categoria:**
Quando a categoria nao e especificada, o sistema:
1. Analisa URL e conteudo da pagina com keywords por categoria
2. Se confianca > 30%, usa a categoria detectada
3. Senao, usa Claude API como fallback
4. Retorna erro se nao conseguir detectar

**Opcoes:**
| Flag | Descricao |
|------|-----------|
| `-u, --url` | URL da pagina do produto |
| `-c, --category` | Categoria do produto (opcional - auto-detectada) |
| `-b, --brand` | Nome da marca (opcional) |
| `-o, --output` | Caminho do arquivo de saida |
| `-f, --file` | Arquivo com URLs (batch mode) |
| `-d, --output-dir` | Diretorio de saida para batch (default: ./generated) |
| `-n, --concurrency` | Requisicoes paralelas (default: 3) |
| `-v, --verbose` | Mostra output detalhado |

**Formato do arquivo batch (urls.txt):**
```
# Comentarios comecam com #
https://loja.com/produto1,notebooks
https://loja.com/produto2,celulares/smartphones,Samsung
https://loja.com/produto3,tvs
```

**Categorias suportadas (15):**
- `celulares/smartphones`
- `notebooks`
- `tvs`
- `eletrodomesticos`
- `moda`
- `games`
- `tablets`
- `audio` (headphones, earbuds, speakers)
- `monitors`
- `smartwatches`
- `cameras`
- `moveis` (sofás, mesas, cadeiras, armários, camas)
- `brinquedos` (LEGO, bonecas, jogos de tabuleiro, educativos)
- `livros` (ficção, não-ficção, didáticos, HQs)
- `beleza` (skincare, maquiagem, perfumes, haircare)

**Funcionamento:**
1. Faz scraping do conteudo da pagina
2. Envia para Claude com prompt especifico da categoria
3. Valida o PRODUCT.md gerado
4. Salva com nome baseado no SKU
5. (Batch) Gera relatorio de sucesso/falha

---

## MCP Servers

### Catalog Server (@pkprotocol/catalog-server)

Serve um catalogo PKP local via MCP.

```bash
pkp-catalog-server ./dist
```

**Tools:**
| Tool | Descricao |
|------|-----------|
| `search_products` | Busca com filtros (query, category, brand, price) |
| `get_product` | Detalhes completos de um produto por SKU |
| `compare_products` | Compara 2-5 produtos |
| `list_categories` | Lista categorias do catalogo |
| `list_brands` | Lista marcas do catalogo |
| `get_catalog_info` | Metadados do catalogo |
| `get_product_faq` | Extrai FAQ do produto |
| `get_alternatives` | Encontra alternativas |

**Resources:**
- `pkp://catalog` - Metadados do catalogo
- `pkp://product/{sku}` - Conteudo PRODUCT.md

### Registry Server (@pkprotocol/registry-server)

Agrega multiplos catalogos PKP para busca global.

```bash
pkp-registry-server --domain pkp.example.com
```

**Tools:**
| Tool | Descricao |
|------|-----------|
| `search_products` | Busca global em todos os catalogos |
| `resolve_product` | Resolve URI pkp://domain/sku |
| `get_product_info` | Info indexada de produto |
| `list_catalogs` | Lista catalogos registrados |
| `register_catalog` | Registra novo catalogo |
| `refresh_catalog` | Re-crawl de catalogo |
| `unregister_catalog` | Remove catalogo |
| `list_categories` | Categorias globais |
| `get_registry_stats` | Estatisticas do registry |
| `compare_across_catalogs` | Comparacao cross-catalogo |

**Resources:**
- `pkp://registry/stats` - Estatisticas
- `pkp://registry/catalogs` - Lista de catalogos

**Storage Backends:**

O Registry Server suporta dois backends de storage:

1. **In-Memory (default)** - Rapido, sem persistencia
   ```bash
   pkp-registry-server --domain pkp.kodda.ai
   ```

2. **PostgreSQL** - Persistente, full-text search em portugues
   ```bash
   pkp-registry-server --storage postgresql \
     --pg-host localhost \
     --pg-database pkp \
     --pg-user pkp
   ```

**Variaveis de Ambiente PostgreSQL:**
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

**Migrations:** Rodar antes de usar PostgreSQL:
```bash
psql -d pkp -f migrations/001_create_pkp_domains.sql
psql -d pkp -f migrations/002_create_pkp_registry_index.sql
psql -d pkp -f migrations/003_create_pkp_query_log.sql
psql -d pkp -f migrations/004_create_fulltext_search_pt.sql
```

---

## Skills (@pkprotocol/skills)

Prompts especializados para assistentes AI:

| Skill | Proposito |
|-------|-----------|
| `consumer` | Assistente geral de produtos |
| `smartphones` | Especialista em smartphones |
| `notebooks` | Especialista em notebooks/laptops |
| `product-explainer` | Tradutor de specs tecnicas |

```typescript
import { CONSUMER_SKILL, SMARTPHONES_SKILL } from "@pkprotocol/skills";

// Usar o systemPrompt em seu AI assistant
console.log(CONSUMER_SKILL.systemPrompt);
```

---

## PKP Studio (@pkprotocol/studio)

Interface web para gerenciar catalogos PKP, construida com Next.js.

**URL de Producao:** https://pkp-studio.vercel.app

```bash
# Desenvolvimento
cd packages/studio
pnpm dev

# Producao
pnpm build
pnpm start
```

**Features:**
- Dashboard com estatisticas do catalogo (77k+ produtos importados)
- Navegacao e busca de produtos com filtros por categoria e marca
- Analytics de acessos por AI agents (rastreamento de buscas)
- Editor visual de PRODUCT.md com validacao em tempo real
- Preview Markdown em split-view no editor
- Geracao de PRODUCT.md via AI (requer ANTHROPIC_API_KEY)
- Batch import de multiplas URLs
- Export para .well-known/pkp/
- Validacao de produtos

**Deploy Vercel:**
O Studio e deployado automaticamente no Vercel com integracao GitHub.

```bash
# Estrutura de deploy (/vercel.json na raiz do monorepo)
{
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm --filter @pkprotocol/spec build && ... && pnpm --filter @pkprotocol/studio run build",
  "outputDirectory": "packages/studio/.next"
}
```

**Importante:** Root Directory no Vercel deve estar **em branco** (usa raiz do repo).

O script `prebuild` copia o `manifest.json` do catalogo para `public/data/` para servir estaticamente.

**Paginas:**
| Rota | Descricao |
|------|-----------|
| `/` | Dashboard com visao geral |
| `/products` | Lista de produtos do catalogo |
| `/generate` | Gerar PRODUCT.md de URL |
| `/batch` | Batch import de multiplas URLs |
| `/export` | Export para .well-known/pkp/ |
| `/edit?path=<file>` | Editor visual de PRODUCT.md |

**API Routes:**
| Endpoint | Descricao |
|----------|-----------|
| `GET /api/products?path=<catalog>` | Lista produtos de um catalogo |
| `POST /api/generate` | Gera PRODUCT.md via Claude API |
| `GET /api/product?path=<file>` | Le um arquivo PRODUCT.md |
| `PUT /api/product` | Salva alteracoes em PRODUCT.md |
| `POST /api/export` | Exporta catalogo para .well-known/pkp/ |

**Editor PRODUCT.md (`/edit`):**
- **Modo Form:** Edita campos estruturados (SKU, nome, marca, categoria, preco, summary)
- **Modo Raw:** Edita markdown direto
- **Sidebar de validacao:** Mostra erros, warnings e completeness em tempo real
- **Preserva campos:** Specs, confidence, identifiers, canonical nao editados sao preservados

---

## Formato PRODUCT.md

```yaml
---
schema: pkp/1.0
sku: "product-sku"
brand: "Brand Name"
name: "Product Name"
category: "category/subcategory"
summary: "Descricao breve para descoberta AI"

identifiers:
  manufacturer_sku: "MFG-123"
  ean: "1234567890123"

canonical:
  manufacturer_url: "https://..."

price:
  type: msrp
  currency: BRL
  value: 1999.00

specs:
  # Especificacoes por categoria

confidence:
  specs:
    source: manufacturer
    verified_at: "2024-01-01"
---

## Highlights
- Feature 1
- Feature 2

## Specifications
Specs detalhadas...

## FAQ
### Pergunta comum?
Resposta...
```

---

## Schemas de Categoria

| Categoria | Campos Principais | min_completeness |
|-----------|-------------------|------------------|
| `smartphones` | display_size, processor, ram_gb, storage_gb, camera_mp, battery_mah | 70% |
| `notebooks` | screen_size, processor, ram_gb, storage_gb, gpu, weight_kg | 70% |
| `tvs` | screen_size, resolution, panel_type, refresh_rate_hz, smart_tv | 60% |
| `eletrodomesticos` | capacity, power_watts, energy_rating, voltage | 60% |
| `moda` | material, sizes, colors, gender, style | 50% |
| `games` | platform, genre, players, rating | 60% |
| `tablets` | display.size_inches, display.resolution, processor.chipset, storage.base_gb | 70% |
| `audio` | type, driver.size_mm, battery.hours_anc_on, connectivity.bluetooth | 60% |
| `monitors` | panel.size_inches, panel.resolution, panel.panel_type, panel.refresh_rate_hz | 65% |
| `smartwatches` | display.size_mm, health.heart_rate, fitness.gps, physical.case_size_mm, os | 65% |
| `cameras` | type, sensor.megapixels, sensor.type, video.max_resolution, body.mount | 65% |
| `moveis` | type, dimensions, material.primary, assembly_required | 55% |
| `brinquedos` | type, age_range.min_years, pieces/players, safety.inmetro | 50% |
| `livros` | type, author, format.type, publication.publisher | 60% |
| `beleza` | type, size.volume_ml, compatibility, certifications | 55% |

---

## Niveis de Confianca

Precedencia (maior para menor):
1. `manufacturer` - Dados oficiais do fabricante
2. `retailer-feed` - Feeds de varejistas autorizados
3. `community` - Dados contribuidos por usuarios
4. `ai-generated` - Dados extraidos por AI
5. `scraped` - Dados raspados da web

---

## Catalogo Kodda

Localizado em `examples/kodda-catalog/` com **77.326 produtos** importados via Awin.

**Varejistas no Catalogo:**
| Varejista | Produtos |
|-----------|----------|
| Kabum BR | 5,928 |
| Adidas BR | 26,346 |
| Centauro BR | 24,353 |
| Mizuno BR | 6,708 |
| Cobasi BR | 8,256 |
| LG BR | 2,582 |
| Consul BR | 2,096 |
| Samsung BR | 691 |
| Electrolux BR | 273 |
| Stanley BR | 122 |

**Categorias Principais:**
- Moda/Esportes (Adidas, Centauro, Mizuno)
- Eletronicos (Kabum, LG, Samsung)
- Casa (Cobasi, Consul, Electrolux, Stanley)

**GitHub Action:** Atualiza catalogo diariamente via cron (`update-catalog.yml`)

---

## Testes

**201 testes passando** em 4 packages:

| Package | Testes | Descricao |
|---------|--------|-----------|
| `@pkprotocol/spec` | 111 | Schemas, parser, validator, categorias |
| `pkp` (CLI) | 43 | init, validate, build, generate (category detection) |
| `@pkprotocol/catalog-server` | 23 | Search, loader, comparacao |
| `@pkprotocol/registry-server` | 24 | Storage (InMemory), search, stats |

```bash
pnpm test  # Roda todos os testes
```

---

## Migrations SQL

Localizadas em `/migrations/`:
- `001_create_pkp_domains.sql` - Registry de dominios
- `002_create_pkp_registry_index.sql` - Indice de produtos
- `003_create_pkp_query_log.sql` - Analytics de queries
- `004_create_fulltext_search_pt.sql` - FTS em Portugues

---

## Documentacao

Site de documentacao usando VitePress, hospedado em https://pkp.kodda.ai/docs/

```bash
# Desenvolvimento local
pnpm docs:dev

# Build para producao
pnpm docs:build

# Preview do build
pnpm docs:preview
```

**Estrutura:**
```
docs/
├── index.md                    # Home page
├── guide/                      # Guias
│   ├── what-is-pkp.md
│   ├── getting-started.md
│   ├── quick-start.md
│   ├── architecture.md
│   ├── product-format.md
│   └── categories.md
├── reference/                  # Referencia
│   └── format.md
├── cli/                        # CLI docs
│   ├── overview.md
│   ├── init.md
│   ├── validate.md
│   ├── build.md
│   ├── serve.md
│   └── generate.md
└── mcp/                        # MCP servers
    ├── catalog-server.md
    └── registry-server.md
```

---

## Deploy

### Estrutura de Branches

| Branch | Conteudo |
|--------|----------|
| `main` | Codigo fonte, docs source |
| `gh-pages` | Landing page + docs buildados |

### URLs

| URL | Descricao |
|-----|-----------|
| https://pkp.kodda.ai | Landing page |
| https://pkp.kodda.ai/docs/ | Documentacao VitePress |
| https://pkp-studio.vercel.app | PKP Studio (Catalog Browser + Analytics) |
| https://github.com/koddaai/pkp | Repositorio GitHub |
| https://www.npmjs.com/org/pkprotocol | Organizacao npm |

### AI Discovery (Crawlers)

Dados PKP publicados para descoberta por AI agents:

**API Endpoints (com tracking):**
| URL | Conteudo |
|-----|----------|
| https://pkp-studio.vercel.app/api/pkp/catalog | Indice do catalogo (com tracking) |
| https://pkp-studio.vercel.app/api/pkp/manifest | 77k produtos (com tracking) |
| https://pkp-studio.vercel.app/api/products?search=X | Busca de produtos |

**Arquivos Estaticos:**
| URL | Conteudo |
|-----|----------|
| https://pkp.kodda.ai/llms.txt | Guia para AI agents |
| https://pkp.kodda.ai/pkp.txt | Ponteiro PKP |
| https://pkp.kodda.ai/robots.txt | Permite crawlers AI (GPTBot, ClaudeBot, etc) |
| https://pkp.kodda.ai/sitemap.xml | Sitemap para indexacao |
| https://pkp.kodda.ai/.well-known/pkp/catalog.json | Indice do catalogo (estatico) |
| https://pkp.kodda.ai/.well-known/pkp/manifest.json | 77k produtos completos (23MB) |

**Crawlers Permitidos:**
- GPTBot (OpenAI)
- ClaudeBot / Claude-Web / Anthropic-AI
- PerplexityBot
- Googlebot / Bingbot

**Arquivos Criados:**
- `.nojekyll` - Desabilita Jekyll para servir `.well-known/`
- `llms.txt` - Formato emergente para guiar AI agents (aponta para API com tracking)
- `robots.txt` - Permite todos os crawlers AI

### DNS (Cloudflare)

```
pkp.kodda.ai CNAME koddaai.github.io
```

### Atualizar Landing/Docs

```bash
# 1. Build docs (na branch main)
cd docs && pnpm vitepress build

# 2. Copiar para gh-pages
git checkout gh-pages
rm -rf docs && mkdir docs
cp -r /path/to/docs/.vitepress/dist/* docs/
git add docs/ && git commit -m "Update docs"
git push origin gh-pages
```

---

## Proximos Passos

### Concluidos
1. ✅ **Smart scraping** - Detectar categoria automaticamente
2. ✅ **Testes E2E** - 201 testes de integracao
3. ✅ **15 categorias** - moveis, brinquedos, livros, beleza, etc
4. ✅ **Studio Editor** - Editor visual com validacao em tempo real
5. ✅ **Landing page** - pkp.kodda.ai com design dark/minimalista
6. ✅ **Docs VitePress** - pkp.kodda.ai/docs/
7. ✅ **Docs: Paginas completas**
   - confidence.md (niveis de confianca)
   - schema.md (referencia completa do schema)
   - categories.md (detalhes de cada categoria)
   - skills.md (como usar os skills)
8. ✅ **Studio: Melhorias**
   - Preview markdown em tempo real (split-view)
   - Batch import de URLs (/batch)
   - Export para .well-known/pkp/ (/export)
9. ✅ **CLI: Novos comandos**
   - `pkp stats` - Estatisticas do catalogo
   - `pkp diff` - Comparar dois PRODUCT.md
   - `pkp publish` - Deploy para diretorio

### Concluidos (v0.3.0)

10. ✅ **Analytics de Acesso AI**
    - Middleware de logging nas rotas de API
    - Deteccao de User-Agent (GPTBot, Claude-Web, PerplexityBot, Anthropic-AI, etc)
    - Dashboard de analytics no Studio (/analytics)
    - Metricas: requests por agent, produtos mais acessados, busca por periodo

11. ✅ **Catalog Browser Publico**
    - PKP Studio deployado em https://pkp-studio.vercel.app
    - Interface para navegar 77k+ produtos
    - Busca por categoria/marca
    - Filtros e ordenacao

12. ✅ **Importacao Massiva Awin**
    - 77.326 produtos importados de 10 varejistas brasileiros
    - GitHub Action para atualizacao diaria automatica
    - Mapeamento completo Awin → PKP

13. ✅ **AI Discovery (Crawlers)**
    - Catalogo publicado em `/.well-known/pkp/` (padrao PKP)
    - `llms.txt` para guiar AI agents
    - `robots.txt` permitindo GPTBot, ClaudeBot, PerplexityBot
    - `sitemap.xml` para indexacao
    - `.nojekyll` para servir arquivos corretamente no GitHub Pages

14. ✅ **API Proxy com Tracking**
    - `/api/pkp/catalog` - Indice do catalogo com deteccao de AI
    - `/api/pkp/manifest` - 77k produtos com deteccao de AI
    - `api-analytics.ts` - Tracking in-memory para Vercel
    - Detecta User-Agents: GPTBot, ClaudeBot, PerplexityBot, Anthropic-AI, etc
    - Dashboard de analytics mostra requests em tempo real
    - `llms.txt` atualizado para apontar para endpoints com tracking

15. ✅ **CI/CD Fixes**
    - Regenerado `pnpm-lock.yaml` para compatibilidade com CI
    - Criado test fixtures em `packages/catalog-server/tests/fixtures/`
    - 10 produtos de exemplo para testes (evita dependencia de dados locais)
    - CI e Release workflows passando (GitHub Actions)

16. ✅ **Vercel Monorepo Fix**
    - Movido `vercel.json` de `packages/studio/` para raiz do monorepo
    - Adicionado `next` em devDependencies da raiz (para deteccao de framework)
    - outputDirectory aponta para `packages/studio/.next`
    - Necessario: Root Directory em branco no Vercel (usa raiz do repo)

### Em Andamento (v0.4.0)

**Insight Chave (validado com LLMs):**
> "LLMs nao consomem protocolos. Plataformas e frameworks consomem."
> O .well-known so funciona se clientes forem programados para consultar.
> Cada LLM tem seu proprio approach - nao existe protocolo universal.

**Realidade Multi-LLM:**

| Plataforma | Suporta MCP? | Como acessa PKP |
|------------|--------------|-----------------|
| Claude Desktop | ✅ Sim | MCP nativo |
| Cursor | ✅ Sim | MCP nativo |
| Claude Web | ❌ Nao | Web fetch (API publica) |
| ChatGPT | ❌ Nao | Web browsing / Custom GPT |
| GPT API | ❌ Nao | Function calling |
| Gemini | ❌ Nao | Function calling / Extensions |
| Perplexity | ❌ Nao | Web search (indexa APIs) |
| Manus | ❌ Nao | Web fetch |

**Arquitetura Universal:**

```
┌─────────────────────────────────────────────────────────────┐
│                    PKP DATA (77k produtos)                  │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│              PKP REST API (universal) ✅ JA EXISTE          │
│       GET /api/products?search=notebook&max_price=5000      │
└─────────────────────────────────────────────────────────────┘
        ↑              ↑              ↑              ↑
   ┌────┴────┐    ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
   │   MCP   │    │ OpenAI  │   │ Gemini  │   │  Web    │
   │ Server  │    │ Custom  │   │ Extension│  │ Fetch   │
   │         │    │   GPT   │   │         │   │         │
   └────┬────┘    └────┬────┘   └────┬────┘   └────┬────┘
        ↓              ↓              ↓              ↓
    Claude         ChatGPT        Gemini       Perplexity
    Desktop        Plus users     API          Claude Web
    Cursor                                     Manus
```

**Prioridade Revisada: Estrategia Multi-LLM**

| # | Item | Alcance | Status |
|---|------|---------|--------|
| 1 | **REST API publica** | Qualquer LLM com web access | ✅ Ja funciona |
| 2 | **MCP Server hospedado** | Claude Desktop, Cursor | 🔄 Deploy pendente |
| 3 | **Custom GPT (OpenAI)** | ChatGPT Plus users | ⏳ Criar |
| 4 | **SEO/Indexacao** | Perplexity, search-grounded LLMs | ⏳ Melhorar |
| 5 | **Landing + Dashboard** | Varejistas | ⏳ Criar |

**Detalhes por integracao:**

1. **REST API Publica** ✅ JA FUNCIONA
   - `https://pkp-studio.vercel.app/api/products?search=X`
   - `https://pkp-studio.vercel.app/api/pkp/catalog`
   - Qualquer LLM com web fetch acessa
   - Rate limit do Vercel protege

2. **MCP Server Hospedado** 🔄 PENDENTE
   - Hospedar `@pkprotocol/catalog-server` publicamente
   - Endpoint: `mcp.pkp.kodda.ai` ou similar
   - Tools: `pkp_search`, `pkp_compare`, `pkp_product`
   - Apenas Claude Desktop e Cursor usam MCP

3. **Custom GPT** ⏳ CRIAR
   - GPT no ChatGPT que chama a REST API do PKP
   - Prompt: "Consulte produtos brasileiros via PKP"
   - Actions apontando para `/api/products`
   - Alcanca usuarios ChatGPT Plus

4. **SEO/Indexabilidade** ⏳ MELHORAR
   - Perplexity indexa paginas web, nao APIs
   - Criar paginas HTML por produto para indexacao
   - schema.org/Product markup
   - Sitemap com produtos individuais

**Custos por integracao:**

| Integracao | Quem paga tokens LLM | Quem paga infra |
|------------|----------------------|-----------------|
| REST API | Usuario (sua LLM) | Kodda (Vercel) |
| MCP Server | Usuario (Claude) | Kodda (VPS) |
| Custom GPT | Usuario (ChatGPT) | Kodda (Vercel) |

**Conclusao:** REST API ja cobre 80% dos casos. MCP e Custom GPT sao bonus para integracao mais profunda.

### Seguranca: Checklist Pre-Deploy MCP Server

**Riscos Mapeados:**

| Categoria | Risco | Impacto | Mitigacao |
|-----------|-------|---------|-----------|
| **DDoS** | Flood de requests | Server down, custos | Rate limit 100 req/min por IP |
| **DDoS** | Queries pesadas | CPU/memoria esgotados | Timeout 5s, max 100 resultados |
| **Scraping** | Baixar todos os 77k produtos | Perda de vantagem | Paginacao obrigatoria, API key |
| **Scraping** | Clone do catalogo | Concorrente espelha | Quotas diarias, monitoramento |
| **Custos** | Uso excessivo free tier | Conta bloqueada | Quotas por tier (free/pro) |
| **Custos** | AI interno (embeddings) | API costs disparam | Cache agressivo |
| **Seguranca** | Injection em queries | SQL/NoSQL injection | Sanitizacao, parametrizacao |
| **Seguranca** | Path traversal | Acesso a arquivos | Validacao SKUs, whitelist |
| **Seguranca** | API keys expostas | Comprometimento | Env vars, nunca em logs |
| **Legal** | LGPD | Multas | Nao armazenar dados pessoais |
| **Legal** | ToS varejistas | Cease & desist | Verificar licencas Awin |
| **Legal** | Precos errados | Reclamacoes | Disclaimer obrigatorio |

**Checklist MVP (obrigatorio antes do deploy):**

```
[ ] Rate limiting: 100 req/min por IP
[ ] API Key obrigatoria (free tier disponivel)
[ ] Paginacao: max 100 produtos por request
[ ] Timeout: 5s por query
[ ] Input validation: sanitizar todos os parametros
[ ] Logging: requests para detectar abuso
[ ] Quotas: 1000 req/dia free tier
[ ] Disclaimer: "precos sujeitos a alteracao"
[ ] ToS: definir termos de uso
```

**Estrutura de Tiers:**

| Tier | Requests/dia | Produtos/request | Bulk Export |
|------|--------------|------------------|-------------|
| Free | 1.000 | 50 | Nao |
| Pro | 50.000 | 100 | Sim |
| Enterprise | Ilimitado | 500 | Sim + SLA |

**Nice to have (pos-MVP):**
- Rate limit progressivo (delay aumenta com volume)
- Honeypot endpoints para detectar scrapers
- Fingerprinting para detectar mesma origem com IPs diferentes
- Watermarking nos dados para rastrear vazamentos

### Importacao de Dados (Awin)

Integracao com Awin para bootstrap do catalogo:
- **API Key:** [REDACTED - use .env]
- **Publisher ID:** [REDACTED]
- **Feed List:** https://ui.awin.com/productdata-darwin-download/publisher/[REDACTED]/.../feedList

**Varejistas Brasileiros Disponiveis:**
| Varejista | Feed ID | Produtos |
|-----------|---------|----------|
| Samsung BR | 89199 | 691 |
| Kabum BR | - | 5,928 |
| Adidas BR | - | 26,346 |
| Centauro BR | - | 24,353 |
| Mizuno BR | - | 6,708 |
| Cobasi BR | - | 8,256 |
| LG BR | - | 2,582 |
| Consul BR | - | 2,096 |
| Electrolux BR | - | 273 |
| Stanley BR | - | 122 |

**Mapeamento Awin → PKP:**
```
merchant_product_id → identifiers.mpn
brand_name → brand
product_name → name
merchant_category → category
description → summary + specs (parsed)
search_price → price.value
product_GTIN → gtin + identifiers.ean
merchant_deep_link → canonical.url
aw_deep_link → purchase_urls[].url
```

**Produto Teste Importado:**
- `examples/kodda-catalog/products/samsung-secadora-dv20b9750cv-az.md`
- Validado: 100% complete

### Posicionamento: PKP vs skills.sh

**Analogia:**
- `skills.sh` = diretorio central de habilidades para AI agents
- `PKP Catalog` = diretorio central de conhecimento de produto para AI agents

**Insight Critico:**
```
LLMs nao consomem protocolos espontaneamente.
Plataformas e frameworks consomem.
.well-known so funciona se houver padrao amplamente adotado.
```

**O que acelera adocao:**
| Estrategia | Impacto | Status |
|------------|---------|--------|
| MCP Server como tool | Game-changer - LLMs chamam diretamente | ✅ Implementado, ⏳ Deploy publico |
| SEO/Indexabilidade | Organico - LLMs consomem via search | ⏳ Parcial |
| Adocao varejistas | Network effect - LLMs precisam do dado | ⏳ Bootstrap via Awin |
| Integracao x402 | Pagamento direto no agent | ⏳ Futuro |

**Onde esta o moat?**

O agent de comparacao em si vira commodity - qualquer um com acesso aos dados consegue fazer. O moat NAO esta no agent. Esta em 3 camadas:

| Camada | Descricao | Modelo de Negocio |
|--------|-----------|-------------------|
| **Dados** | Base mais completa e atualizada. Network effect: mais varejistas → mais util → mais agents usam → mais varejistas | Volume, cobertura |
| **Analytics** | Saber quais produtos AI agents recomendam. "Claude recomendou seu concorrente 3x mais essa semana" | SaaS para varejistas |
| **Narrativa** | Varejista define como AI fala do produto. preferred_terms, comparison_axes, objecoes | SaaS premium |

### Proposta de Valor para Varejistas

**Problema:**
- AI agents (ChatGPT, Claude, Perplexity) ja recomendam produtos
- Sem PKP, inventam specs, precos errados, links quebrados
- Varejista perde controle da narrativa

**Solucao PKP:**
| Aspecto | Sem PKP | Com PKP |
|---------|---------|---------|
| Specs | AI inventa | Specs oficiais |
| Preco | Desatualizado | Preco atual + link |
| Link compra | Generico/quebrado | Link com tracking |
| Narrativa | AI decide | preferred_terms do varejista |
| Comparacao | AI compara como quer | comparison_axes definidos |

**ROI Mensuravel:**
- Conversoes via links PKP (rastreavel)
- Reducao de reclamacoes sobre info errada
- Brand safety - controle do que AI fala

### Futuro (v0.5.0+)

**Foco: Integracao x402 e Agentic Commerce**

O PKP e a camada de conhecimento do stack de agentic commerce. O proximo passo e integrar com x402 para pagamentos.

**Stack Completo:**
```
┌─────────────────────────────────────────────────┐
│  USER: "Quero um notebook bom pra programar"    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  PKP: Conhecimento do produto                   │
│  - O que é? Specs, reviews, comparações         │
│  - Por que esse? Alternativas, trade-offs       │
│  - Onde comprar? Links, preços                  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  x402/AP2: Pagamento                            │
│  - Autorização do usuário                       │
│  - Agent paga em USDC                           │
│  - Micropagamentos ($0.001/request possível)    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  UCP: Transação                                 │
│  - Checkout, entrega, pós-venda                 │
└─────────────────────────────────────────────────┘
```

**x402 Protocol:**
- Protocolo de pagamento nativo HTTP (Coinbase + Cloudflare, set/2025)
- Usa HTTP 402 "Payment Required" status code
- Agent faz request → Server retorna 402 + detalhes → Agent paga em stablecoin → Server libera
- Ja processou 100M+ payment flows
- Suportado por Cloudflare, Google, Vercel
- Integrado ao AP2 (Agent Payments Protocol) do Google
- Ref: https://x402.org, https://docs.cdp.coinbase.com/x402/

**Roadmap x402:**
1. ⏳ Adicionar `x402_enabled: true` em `purchase_urls[]`
2. ⏳ Endpoint de checkout PKP que retorna HTTP 402
3. ⏳ SDK para varejistas integrarem pagamento
4. ⏳ Dashboard de transacoes

**Outras prioridades futuras:**
- Deploy do Registry Server (infra Kodda)
- Integracoes (Claude Desktop, Cursor, etc)
- Marketing (posts, demo video)

---

## Publicacao npm

O projeto usa [Changesets](https://github.com/changesets/changesets) para versionamento e publicacao.

### Criar um changeset

```bash
pnpm changeset
```

Selecione os packages alterados, tipo de bump (patch/minor/major) e descricao.

### Publicar (automatico via GitHub Actions)

1. Merge changesets para `main`
2. GitHub Action cria PR "Version Packages"
3. Merge do PR dispara publicacao no npm

### Publicar manualmente

```bash
pnpm changeset version  # Aplica bumps de versao
pnpm build              # Build todos os packages
pnpm changeset publish  # Publica no npm
```

### Secrets necessarios no GitHub

- `NPM_TOKEN` - Token de publicacao do npm

---

## Comandos de Desenvolvimento

```bash
# Instalar dependencias
pnpm install

# Build todos os packages
pnpm build

# Rodar testes
pnpm test

# Validar exemplos
node packages/cli/dist/cli.js validate examples/kodda-catalog

# Build catalogo de exemplo
node packages/cli/dist/cli.js build examples/kodda-catalog

# Servir localmente
node packages/cli/dist/cli.js serve examples/kodda-catalog/dist

# Gerar PRODUCT.md via AI (requer ANTHROPIC_API_KEY)
node packages/cli/dist/cli.js generate -u https://loja.com/produto -c notebooks

# Iniciar catalog server
node packages/catalog-server/dist/cli.js examples/kodda-catalog/dist

# Iniciar registry server
node packages/registry-server/dist/cli.js --domain pkp.example.com
```

---

## Decisoes de Arquitetura

### Skills 100% Kodda-owned
- Skills publicadas pela Kodda
- Fornecedor NAO publica skills - so publica dados
- Narrativa do fornecedor via `highlights` e `preferred_terms`

### Product URI Canonico
- Formato: `pkp://{domain}/{sku}`
- Permite referencia estavel entre conversas

### Regras de Precedencia
```
manufacturer > retailer > aggregator > community
```

---

*Ultima sessao: 2026-02-11*
*Status: v0.3.2 - REST API publica ja funciona (80% dos casos). Roadmap multi-LLM: REST API ✅ → MCP Server → Custom GPT → SEO. Cada LLM tem seu approach, nao existe protocolo universal.*
