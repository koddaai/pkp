# PKP - Contexto de Desenvolvimento

**Projeto:** Product Knowledge Protocol (PKP)
**Autor:** Pedro / Kodda.ai
**Versao:** v0.2.0
**Ultima Atualizacao:** 2026-02-10
**GitHub:** https://github.com/koddaai/pkp
**Landing:** https://pkp.kodda.ai
**Docs:** https://pkp.kodda.ai/docs/
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

```bash
# Desenvolvimento
cd packages/studio
pnpm dev

# Producao
pnpm build
pnpm start
```

**Features:**
- Dashboard com estatisticas do catalogo
- Navegacao e busca de produtos
- Editor visual de PRODUCT.md com validacao em tempo real
- Preview Markdown em split-view no editor
- Geracao de PRODUCT.md via AI (requer ANTHROPIC_API_KEY)
- Batch import de multiplas URLs
- Export para .well-known/pkp/
- Validacao de produtos

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

## Catalogo de Exemplo

Localizado em `examples/kodda-catalog/` com 10 produtos:
- 3 smartphones (Galaxy S25 Ultra, iPhone 16 Pro Max, Pixel 9 Pro XL)
- 2 notebooks (MacBook Air M4, Dell XPS 15)
- 1 TV (Samsung Neo QLED 65")
- 1 eletrodomestico (Lava-loucas Electrolux)
- 2 moda (Nike Air Max 90, Adidas Ultraboost Light)
- 1 game (PlayStation 5 Pro)

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
| https://github.com/koddaai/pkp | Repositorio GitHub |
| https://www.npmjs.com/org/pkprotocol | Organizacao npm |

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

### Futuro
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

*Ultima sessao: 2026-02-10*
*Status: v0.2.0 publicado no npm (@pkprotocol/*) - Landing page em pkp.kodda.ai (gh-pages), Docs VitePress completos em pkp.kodda.ai/docs/ (gh-pages), DNS via Cloudflare CNAME, GitHub repo koddaai/pkp, 15 categorias, CLI com AI generation + auto-detect + stats/diff/publish, Catalog Server, Registry Server com PostgreSQL, Skills, PKP Studio com editor visual + preview + batch import + export, 201 testes E2E*
