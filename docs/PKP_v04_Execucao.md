# PKP — Plano de Execução v0.4
## Passo a passo para construir o Product Knowledge Protocol

**Autor:** Pedro / Kodda.ai
**Data:** 06 de fevereiro de 2026
**Status:** v0.4.3
**Referência:** PKP_v04_Conceitual.md

**Changelog:**
- v0.2: agent-first, separação formato/transporte, confidence levels
- v0.3: modelo de preço realista, claim endurecido, freshness, quality gates, KPIs reais
- v0.4: **arquitetura web-native** (`.well-known/pkp/`), Agent Skill de consumo, integração AP2, 3 camadas de acesso, simplificação do claim flow
- v0.4.1: Product URI canônico, regras de canonicidade, segurança de skill.md, catalog shards spec, catalog_updated_at no Registry
- v0.4.2: Variantes (family_id/variant_of), identifiers[] multi-padrão, completeness por categoria, precedência formal de skills, algoritmo canônico
- v0.4.3: **Skills 100% Kodda-owned** (skills.sh). Skill C eliminada → campos `highlights`/`preferred_terms` no PRODUCT.md. Estrutura sem pasta skills/. Adicionado `pkp.txt`.

---

## 1. Mudança Arquitetural: Web-native First

### 1.1 A mudança

**Antes (v0.3):** Dados ficam no MCP Server da Kodda. Agent conecta via MCP para acessar.

**Agora (v0.4):** Dados ficam no **domínio do fornecedor** (ou da Kodda no bootstrap), no caminho `/.well-known/pkp/`. Agent faz HTTP GET para acessar. MCP Server é uma camada opcional por cima.

Isso é mais poderoso porque:
- Zero infraestrutura obrigatória — é um arquivo num servidor
- Mesmo modelo que robots.txt, sitemap.xml, llms.txt
- Qualquer agent acessa sem SDK, sem MCP, sem conta
- Fornecedor tem controle total no seu domínio
- Prova de ownership é implícita (se está no seu domínio, é seu)

### 1.2 As 3 camadas

```
CAMADA 1 — Estático (arquivo no servidor)
├── /pkp.txt                        → Ponteiro (opcional)
├── /.well-known/pkp/catalog.json   → índice L0
├── /.well-known/pkp/products/*.md  → PRODUCT.md
├── Acesso: HTTP GET
├── Custo: zero
└── Quem pode fazer: qualquer um com domínio

CAMADA 2 — MCP Server (dinâmico)
├── Serve dados PKP via MCP protocol
├── Tools: search, compare, filter, faq, alternatives
├── Acesso: MCP client (Claude Desktop, etc)
├── Custo: VPS (~$10/mês)
└── Quem faz: Kodda (managed) ou self-hosted

CAMADA 3 — Registry (discovery central)
├── Indexa /.well-known/pkp/ de múltiplos domínios
├── Busca cross-domínio (search_products_global)
├── Freshness + staleness tracking
├── Acesso: MCP ou REST API
├── Custo: Kodda opera
└── Quem faz: Kodda (é o negócio)
```

### 1.3 Impacto na organização do código

```
packages/
├── spec/                  # ← FORMATO (schemas, parser, validador — igual antes)
│
├── static-generator/      # ← NOVO: Gera /.well-known/pkp/ a partir de PRODUCT.md
│   └── Lê catálogo → gera catalog.json + products/ + pkp.txt
│
├── catalog-server/        # ← MCP Server (Camada 2 — mesmo de antes)
│
├── registry-server/       # ← Registry (Camada 3 — agora também crawla domínios)
│   └── indexer: crawla /.well-known/pkp/ dos domínios registrados
│
├── cli/                   # ← CLI (agora inclui `pkp serve` e `pkp deploy`)
│
└── shared/
```

---

## 2. O Que Será Construído

### 2.1 — Package `spec` (formato PKP puro)

Igual v0.3. Schemas Zod, parser, validador, types TypeScript. Zero dependência de MCP.

```typescript
import {
  PKPProductBase,           // Schema base
  PKPConfidence,            // Confidence block
  parseProductMd,           // PRODUCT.md string → objeto
  serializeProduct,         // objeto → PRODUCT.md string
  validateProduct,          // → { valid, errors, warnings, completeness }
  getCategorySchema,        // categoria → ZodSchema
} from "@pkprotocol/spec";
```

**Schemas de preço atualizados (v0.3+):**

```typescript
// packages/spec/src/schemas/price.ts
export const PKPPrice = z.object({
  type: z.enum(["msrp", "street", "range", "unknown"]),
  currency: z.string().default("BRL"),
  value: z.number().positive().optional(),
  min: z.number().positive().optional(),
  max: z.number().positive().optional(),
  map: z.number().positive().optional(),
  source: z.enum(["manufacturer", "retailer", "inferred"]),
  updated_at: z.string().datetime(),
}).refine(
  (p) => {
    if (p.type === "msrp" || p.type === "street") return p.value != null;
    if (p.type === "range") return p.min != null && p.max != null;
    return true;
  },
  { message: "Price fields must match type" }
);
```

**Schemas de confidence (v0.3):**

```typescript
// packages/spec/src/schemas/confidence.ts
export const ConfidenceBlock = z.object({
  level: z.enum(["high", "medium", "low"]),
  source: z.enum(["manufacturer", "retailer-feed", "community", "ai-generated", "scraped"]),
  verified_at: z.string().datetime(),
});
```

**Schema de purchase_urls (novo v0.4):**

```typescript
// packages/spec/src/schemas/purchase.ts
export const PurchaseUrl = z.object({
  retailer: z.string(),
  url: z.string().url(),
  ap2_enabled: z.boolean().default(false),
});

export const PKPPurchaseUrls = z.array(PurchaseUrl).optional();
```

**Schema de canonical + Product URI (novo v0.4.1):**

```typescript
// packages/spec/src/schemas/canonical.ts
export const PKPCanonical = z.object({
  domain: z.string(),
  url: z.string(),
}).optional();

// No base.ts, adicionar:
//   uri: z.string().regex(/^pkp:\/\/[^/]+\/.+$/).optional(),
//   canonical: PKPCanonical,
// Formato do URI: pkp://{domain}/{sku}
```

**Schema de variantes + identificadores (novo v0.4.2):**

```typescript
// packages/spec/src/schemas/variant.ts
export const PKPIdentifiers = z.object({
  mpn: z.string().optional(),       // Manufacturer Part Number
  ean: z.string().optional(),       // European Article Number
  asin: z.string().optional(),      // Amazon Standard ID
  upc: z.string().optional(),       // Universal Product Code
}).optional();

export const PKPVariant = z.object({
  family_id: z.string().optional(),           // agrupa variantes do mesmo modelo
  variant_of: z.string().nullable().optional(), // SKU pai (null = modelo principal)
  variant_attributes: z.array(z.string()).optional(), // eixos de variação
});

// No base.ts, adicionar:
//   identifiers: PKPIdentifiers,
//   family_id: z.string().optional(),
//   variant_of: z.string().nullable().optional(),
//   variant_attributes: z.array(z.string()).optional(),
```

**Completeness por categoria (novo v0.4.2):**

```typescript
// Cada category schema define seu threshold
// packages/spec/src/schemas/categories/smartphones.ts
export const SmartphoneCategoryMeta = {
  category: "celulares/smartphones",
  min_completeness: 0.70,  // smartphones exigem mais campos
  // ...
};

// packages/spec/src/schemas/categories/moda.ts
export const ModaCategoryMeta = {
  category: "moda",
  min_completeness: 0.50,  // moda tem menos campos estruturados
  // ...
};

// O validator usa category-specific threshold:
// const threshold = getCategoryMeta(product.category)?.min_completeness ?? 0.60;
```

**Schema de narrativa do fornecedor (novo v0.4.3):**

```typescript
// packages/spec/src/schemas/narrative.ts
export const PKPPreferredTerm = z.object({
  term: z.string(),
  avoid: z.array(z.string()).optional(),
});

export const PKPNarrative = z.object({
  highlights: z.array(z.string()).optional(),
  preferred_terms: z.array(PKPPreferredTerm).optional(),
});

// No base.ts, adicionar:
//   highlights: z.array(z.string()).optional(),
//   preferred_terms: z.array(PKPPreferredTerm).optional(),
```

**Schema de reviews agregados (novo v0.4.3):**

```typescript
// packages/spec/src/schemas/reviews.ts
export const PKPReviews = z.object({
  average_rating: z.number().min(0).max(5),
  total_reviews: z.number().int().min(0),
  source: z.string().optional(),                        // "multiple", "amazon", etc
  highlights_positive: z.array(z.string()).optional(),
  highlights_negative: z.array(z.string()).optional(),
}).optional();

// No base.ts, adicionar:
//   reviews: PKPReviews,
```

---

### 2.2 — Package `static-generator` (NOVO — gera /.well-known/pkp/)

**O que é:** Ferramenta que lê PRODUCT.md de um diretório e gera a estrutura `.well-known/pkp/` pronta pra deploy.

**Input:**

```
meu-catalogo/
├── galaxy-s25-ultra/PRODUCT.md
├── galaxy-s25/PRODUCT.md
└── pkp.config.yml          # metadata do publisher
```

**Output:**

```
.well-known/pkp/
├── catalog.json              # Índice gerado automaticamente
└── products/
    ├── galaxy-s25-ultra.md   # Cópia validada
    └── galaxy-s25.md

pkp.txt                       # Ponteiro na raiz (opcional)
```

**Config:**

```yaml
# pkp.config.yml
publisher:
  name: "Samsung Brasil"
  type: "manufacturer"
  domain: "samsung.com.br"
  contact: "produtos@samsung.com.br"
```

**Implementação:**

```typescript
// packages/static-generator/src/generate.ts
export async function generateWellKnownPKP(
  catalogDir: string,
  config: PKPConfig,
  outputDir: string
) {
  const products = await loadAndValidateProducts(catalogDir);

  // Gera catalog.json com L0 de cada produto
  const catalog = {
    schema: "pkp/1.0",
    type: "catalog" as const,
    publisher: config.publisher,
    categories: [...new Set(products.map(p => p.category))],
    total_products: products.length,
    updated_at: new Date().toISOString(),
    products: products.map(p => ({
      sku: p.sku,
      uri: `pkp://${config.publisher.domain}/${p.sku}`,
      gtin: p.gtin ?? undefined,
      name: p.name,
      category: p.category,
      summary: p.summary,
      price: p.price,
      confidence_source: p.confidence?.specs?.source ?? "unknown",
      completeness_score: p.completeness,
      url: `/.well-known/pkp/products/${slugify(p.sku)}.md`,
      updated_at: p.price?.updated_at,
    })),
  };

  // Escreve catalog.json
  await writeFile(join(outputDir, "catalog.json"), JSON.stringify(catalog, null, 2));

  // Copia PRODUCT.md validados
  for (const p of products) {
    await copyFile(p.sourcePath, join(outputDir, "products", `${slugify(p.sku)}.md`));
  }

  // Gera pkp.txt (ponteiro na raiz)
  await writeFile(join(rootDir, "pkp.txt"), [
    "# PKP (Product Knowledge Protocol)",
    `# ${config.publisher.name}`,
    "# Spec: github.com/koddaai/pkp",
    "",
    "catalog: /.well-known/pkp/catalog.json",
  ].join("\n"));
}
```

---

### 2.3 — Package `catalog-server` (MCP Server — Camada 2)

Mesmo de v0.3. MCP Server que serve dados PKP com tools:

| Tool | Descrição |
|------|-----------|
| `search_products` | Busca com `min_confidence`, `cursor`, `page_size` |
| `get_product` | Detalhes L0/L1/L2 |
| `compare_products` | Tabela comparativa |
| `get_faq` | FAQ do produto |
| `get_alternatives` | Alternativas com razões |
| `get_compatibility` | Acessórios compatíveis |

**Mudança v0.4:** O catalog-server pode ser alimentado tanto por um diretório local de PRODUCT.md quanto por um banco PostgreSQL. Para o MVP, diretório local é suficiente.

---

### 2.4 — Package `registry-server` (Discovery Central — Camada 3)

**Mudança v0.4:** O Registry agora funciona como **crawler + índice**, não apenas como MCP Server:

```typescript
// packages/registry-server/src/indexer/crawler.ts
export async function crawlDomainPKP(domain: string) {
  try {
    // Tenta buscar catalog.json no domínio
    const catalogUrl = `https://${domain}/.well-known/pkp/catalog.json`;
    const response = await fetch(catalogUrl);

    if (!response.ok) return null;

    const catalog = await response.json();

    // Valida schema do catalog.json
    const parsed = PKPCatalogSchema.safeParse(catalog);
    if (!parsed.success) {
      logger.warn({ domain, errors: parsed.error }, "Invalid catalog.json");
      return null;
    }

    // Upsert no registry index
    for (const product of parsed.data.products) {
      // Quality gate: só indexa se completeness >= 60%
      if ((product.completeness_score ?? 0) < 0.60) continue;

      await upsertRegistryIndex({
        source_domain: domain,
        source_type: catalog.publisher.type,
        product_uri: `pkp://${domain}/${product.sku}`,
        product_gtin: product.gtin ?? null,
        canonical_domain: product.canonical?.domain ?? null,
        catalog_updated_at: parsed.data.updated_at,
        ...product,
        indexed_at: new Date(),
      });
    }

    // Atualiza domínio com catalog_updated_at
    await updateDomain(domain, {
      last_crawled_at: new Date(),
      last_status: "ok",
      catalog_updated_at: parsed.data.updated_at,
      total_products: parsed.data.total_products,
    });

    return { domain, products_indexed: parsed.data.products.length };
  } catch (err) {
    logger.error({ domain, err }, "Failed to crawl domain PKP");
    return null;
  }
}
```

**Scheduler:** Crawla domínios registrados a cada 30 minutos.

**Tools do Registry (MCP):**

| Tool | Descrição |
|------|-----------|
| `discover_catalogs` | Lista domínios com PKP, por categoria/país |
| `search_products_global` | Busca cross-domínio no índice (resolve canonical automaticamente) |
| `get_catalog_info` | Info sobre um domínio PKP |
| `resolve_product` | Dado um `product_uri` ou GTIN, retorna fonte canônica |
| `register_domain` | Adiciona domínio para crawl |
| `report_issue` | Reporta dado incorreto |

**Nota:** O claim flow se simplifica massivamente com web-native. Se `samsung.com.br/.well-known/pkp/` existe, Samsung é o publisher. O domínio É a prova. O Registry resolve conflitos via `canonical_domain` + regra de precedência (`manufacturer > retailer > aggregator > community`).

---

### 2.5 — Package `cli`

**Comandos atualizados v0.4:**

```bash
# Inicializar catálogo
npx pkp init meu-catalogo
# → Cria diretório + PRODUCT.md template + pkp.config.yml

# Validar produto
npx pkp validate ./galaxy-s25-ultra/PRODUCT.md
# → ✅ Valid PKP v1.0 | completeness: 90% | confidence: specs=high(manufacturer)

# Gerar PRODUCT.md a partir de URL
npx pkp generate --url "https://samsung.com.br/galaxy-s25-ultra/" --category smartphones
# → confidence.source: "ai-generated"

# Gerar em batch
npx pkp generate --urls products.csv --output ./catalog/

# NOVO: Gerar /.well-known/pkp/ para deploy
npx pkp build ./catalog/
# → Gera .well-known/pkp/ com catalog.json + products/ + pkp.txt na raiz

# NOVO: Servir localmente para teste
npx pkp serve ./catalog/
# → Serve em http://localhost:3000/.well-known/pkp/
# → Testa como agent veria no domínio real

# NOVO: Deploy direto (copia para servidor via SSH/rsync)
npx pkp deploy ./catalog/ --target user@server:/var/www/html/

# Publicar no MCP Server managed (Kodda)
npx pkp publish ./catalog/ --registry https://pkp.kodda.ai

# Listar schemas
npx pkp schemas
npx pkp schemas celulares/smartphones
```

---

### 2.6 — Agent Skills (Kodda-owned)

Skills PKP são publicadas e mantidas exclusivamente pela Kodda, no modelo do skills.sh. O fornecedor não publica skills — só publica dados.

| # | Skill | Tipo | O que faz |
|---|-------|------|-----------|
| 1 | `pkp-consumer` | core | Como descobrir e ler dados PKP |
| 2 | `pkp-{category}` | core | Como comparar/recomendar por categoria |
| 3 | `pkp-price-tracker` | core | Avaliar preço e momento de compra |
| 4 | `pkp-gift-finder` | core | Recomendar presentes por persona/ocasião |
| 5 | `pkp-product-explainer` | core | Traduzir specs técnicas para leigos |
| 6 | `brazilian-ecommerce` | ecossistema | PIX, frete, Procon, direitos do consumidor BR |
| 7 | `product-review-analyst` | ecossistema | Sintetizar e interpretar reviews |

**Distribuição:**
- **skills.sh** (plataforma pública de Agent Skills)
- **github.com/koddaai/pkp/skills/** (repo oficial)
- **Registry da Kodda** como resource MCP

**O que antes era "Skill C" (domain):** Virou campos no PRODUCT.md (`highlights`, `preferred_terms`). O fornecedor controla sua narrativa via dados estruturados, não via skill.

**Implementação Fase 1:**
- `pkp-consumer`: completa, publicada em skills.sh
- `pkp-smartphones`, `pkp-notebooks`: 2 categorias
- `pkp-product-explainer`: smartphones + notebooks

**Implementação Fase 2:**
- `pkp-{category}`: expandir para 5-10 categorias
- `pkp-price-tracker`: requer dados de preço histórico no Registry
- `pkp-gift-finder`: requer base de 100+ produtos para recomendações úteis
- `brazilian-ecommerce`: independe de PKP, pode publicar antes
- `product-review-analyst`: requer campo `reviews` no PRODUCT.md (opcional)

---

### 2.7 — PKP Studio (Web App — Fase 2)

Igual v0.3. SaaS para criar/editar/publicar sem terminal.

**Mudança v0.4:** Agora o Studio também gera o `.well-known/pkp/` package pronto para download/deploy, além de publicar no MCP Server managed.

---

## 3. Stack Tecnológico

| Componente | Tecnologia | Justificativa |
|-----------|------------|---------------|
| **Runtime** | Node.js 22+ | Type stripping, ecossistema TS |
| **MCP Framework** | FastMCP | Simplifica tools, resources, prompts |
| **Banco** | PostgreSQL 16 | JSONB, full-text search PT, GIN |
| **Cache** | Redis 7 | Cache queries, rate limiting |
| **Validação** | Zod | Peer dep do MCP SDK |
| **Parser** | gray-matter | YAML frontmatter |
| **CLI** | commander | Subcommands, args |
| **AI** | Anthropic SDK (Claude Sonnet) | Geração PRODUCT.md |
| **Monorepo** | Turborepo + pnpm | Build orchestration |
| **Containers** | Docker | Deploy consistente |
| **Proxy** | Traefik v2.11 | Já na VPS |
| **HTTP client** | undici | Crawling (Registry) |

### Infraestrutura

| Componente | Onde | Custo |
|-----------|------|-------|
| VPS (Hetzner) | Debian 13, 16GB RAM, Docker Swarm | Já pago |
| PostgreSQL | Container na VPS | Zero |
| Redis | Container na VPS | Zero |
| `.well-known/pkp/` da Kodda | Servido pela VPS (Traefik) | Zero |
| AI (geração PRODUCT.md) | ~$0.02/produto (Claude Sonnet) | ~$2 p/ 100 produtos |

**Custo total MVP: ~$5** (tokens AI). Tudo roda na VPS existente.

---

## 4. Fases de Implementação

### FASE 0 — Spec + Fundação (Semana 1-2)

**Objetivo:** Spec definida, schemas prontos, 10 PRODUCT.md exemplo, parser funcional.

#### 0.1 — Monorepo

```
pkp/
├── packages/
│   ├── spec/
│   ├── static-generator/
│   ├── catalog-server/
│   ├── registry-server/
│   ├── cli/
│   └── shared/
├── examples/
│   ├── samsung-br/
│   ├── apple-br/
│   └── ...
├── skills/                   # Agent Skills (publicados em skills.sh)
│   ├── pkp-consumer.md       # Core: como consumir PKP
│   ├── pkp-smartphones.md    # Core: como comparar smartphones
│   ├── pkp-notebooks.md      # Core: como comparar notebooks
│   ├── pkp-price-tracker.md  # Core: avaliar preço/momento de compra
│   ├── pkp-gift-finder.md    # Core: recomendar presentes
│   ├── pkp-product-explainer.md  # Core: traduzir specs para leigos
│   ├── brazilian-ecommerce.md    # Ecossistema: e-commerce BR
│   └── product-review-analyst.md # Ecossistema: interpretar reviews
├── migrations/
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

#### 0.2 — Schemas (spec)

Ordem de implementação:
1. `schemas/confidence.ts`
2. `schemas/price.ts`
3. `schemas/purchase.ts`
4. `schemas/canonical.ts` — Product URI + canonical
5. `schemas/variant.ts` — family_id, variant_of, identifiers
6. `schemas/narrative.ts` — highlights, preferred_terms
7. `schemas/reviews.ts` — reviews agregados (opcional)
8. `schemas/base.ts` — importa todos os acima
8. `schemas/categories/smartphones.ts` — inclui min_completeness: 0.70
9. `schemas/categories/notebooks.ts` — inclui min_completeness: 0.70
10. `schemas/categories/tvs.ts` — inclui min_completeness: 0.60
11. `schemas/categories/moda.ts` — inclui min_completeness: 0.50
12. `schemas/categories/eletrodomesticos.ts` — inclui min_completeness: 0.60
13. `schemas/catalog.ts` — schema do catalog.json (com suporte a shards)
14. `parser.ts` — PRODUCT.md ↔ JSON
15. `validator.ts` — validação + completeness score (usa min_completeness da categoria)
16. Testes (Vitest)

**Schema do catalog.json (v0.4.1 — com shards):**

```typescript
// packages/spec/src/schemas/catalog.ts
export const PKPCatalogPublisher = z.object({
  name: z.string(),
  type: z.enum(["manufacturer", "retailer", "aggregator", "community"]),
  domain: z.string(),
  contact: z.string().email().optional(),
});

export const PKPCatalogProduct = z.object({
  sku: z.string(),
  uri: z.string().optional(),              // pkp://{domain}/{sku}
  name: z.string(),
  category: z.string(),
  summary: z.string(),
  price: PKPPrice.optional(),
  confidence_source: z.string().optional(),
  completeness_score: z.number().min(0).max(1).optional(),
  url: z.string(),
  updated_at: z.string().datetime().optional(),
});

// Shard reference (para catálogos grandes)
export const PKPCatalogShard = z.object({
  category: z.string(),
  url: z.string(),
  count: z.number(),
});

// Catálogo completo (< 500 produtos) ou índice de shards (> 500)
export const PKPCatalog = z.object({
  schema: z.literal("pkp/1.0"),
  type: z.enum(["catalog", "index"]).default("catalog"),
  publisher: PKPCatalogPublisher,
  categories: z.array(z.string()),
  total_products: z.number(),
  updated_at: z.string().datetime(),
  // type: "catalog" → lista inline
  products: z.array(PKPCatalogProduct).optional(),
  // type: "index" → referências para shards por categoria
  shards: z.array(PKPCatalogShard).optional(),
}).refine(
  (c) => {
    if (c.type === "catalog") return c.products != null && c.products.length > 0;
    if (c.type === "index") return c.shards != null && c.shards.length > 0;
    return true;
  },
  { message: "catalog needs products, index needs shards" }
);
```

#### 0.3 — 10 PRODUCT.md de Exemplo

| # | Produto | Categoria | confidence.source |
|---|---------|-----------|-------------------|
| 1 | Samsung Galaxy S25 Ultra 256GB | smartphones | ai-generated |
| 2 | iPhone 16 Pro Max 256GB | smartphones | ai-generated |
| 3 | Google Pixel 9 Pro XL | smartphones | ai-generated |
| 4 | MacBook Air M4 15" | notebooks | ai-generated |
| 5 | Dell XPS 15 (2025) | notebooks | ai-generated |
| 6 | Samsung Neo QLED 65" | tvs | ai-generated |
| 7 | Electrolux Lava-louças LV14B | eletrodomesticos | ai-generated |
| 8 | Nike Air Max 90 | moda | ai-generated |
| 9 | Adidas Ultraboost Light | moda | ai-generated |
| 10 | PlayStation 5 Pro | games | ai-generated |

#### 0.4 — Migrations SQL

```sql
-- migrations/001_registry.sql

-- Domínios registrados para crawl
CREATE TABLE pkp_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT UNIQUE NOT NULL,
    publisher_name TEXT,
    publisher_type TEXT DEFAULT 'aggregator',
    last_crawled_at TIMESTAMPTZ,
    last_status TEXT,                    -- 'ok' | 'error' | 'not-found'
    catalog_updated_at TIMESTAMPTZ,     -- updated_at do catalog.json (freshness real)
    total_products INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice de produtos (snapshot do catalog.json de cada domínio)
CREATE TABLE pkp_registry_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_domain TEXT NOT NULL,
    source_type TEXT,                    -- 'manufacturer' | 'retailer' | 'aggregator'
    product_sku TEXT NOT NULL,
    product_uri TEXT,                    -- pkp://{domain}/{sku} (handle estável)
    product_gtin TEXT,                   -- GTIN para cross-domain matching
    product_name TEXT NOT NULL,
    product_category TEXT NOT NULL,
    product_summary TEXT,
    product_price_type TEXT,
    product_price_value NUMERIC(12,2),
    product_price_currency TEXT DEFAULT 'BRL',
    confidence_source TEXT,
    completeness_score REAL,
    product_url TEXT,                    -- URL relativa no domínio
    canonical_domain TEXT,               -- domínio canônico (se declarado)
    catalog_updated_at TIMESTAMPTZ,      -- updated_at do catalog.json (freshness do catálogo)
    indexed_at TIMESTAMPTZ DEFAULT NOW(),-- quando o crawler indexou
    staleness TEXT GENERATED ALWAYS AS (
        CASE
            WHEN COALESCE(catalog_updated_at, indexed_at) > NOW() - INTERVAL '24 hours' THEN 'fresh'
            WHEN COALESCE(catalog_updated_at, indexed_at) > NOW() - INTERVAL '7 days' THEN 'ok'
            ELSE 'stale'
        END
    ) STORED,
    UNIQUE(source_domain, product_sku)
);

CREATE INDEX idx_registry_search ON pkp_registry_index USING GIN(
    to_tsvector('portuguese', product_name || ' ' || COALESCE(product_summary,'') || ' ' || source_domain)
);
CREATE INDEX idx_registry_category ON pkp_registry_index(product_category);
CREATE INDEX idx_registry_staleness ON pkp_registry_index(staleness);
CREATE INDEX idx_registry_gtin ON pkp_registry_index(product_gtin) WHERE product_gtin IS NOT NULL;
CREATE INDEX idx_registry_uri ON pkp_registry_index(product_uri) WHERE product_uri IS NOT NULL;

-- Query log
CREATE TABLE pkp_query_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_type TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    parameters JSONB,
    client_info TEXT,
    duration_ms INT,
    result_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Notas v0.4.1:**
- `catalog_updated_at` vem do `updated_at` do catalog.json — mede freshness do catálogo, não do crawler
- `staleness` agora usa `COALESCE(catalog_updated_at, indexed_at)` — freshness real
- `product_uri` e `product_gtin` permitem cross-domain matching (mesmo produto em domínios diferentes)
- `canonical_domain` permite que o Registry redirecione agents para a fonte oficial

**Entregável Fase 0:** `pnpm test` passa. 10 PRODUCT.md validam. Parser faz round-trip.

---

### FASE 1 — Camadas Funcionais (Semana 3-6)

**Objetivo:** As 3 camadas funcionando. CLI publicado. Testável com Claude Desktop.

#### 1.1 — Static Generator + CLI build/serve (Semana 3)

```bash
# Gera .well-known/pkp/ a partir do catálogo exemplo
npx pkp build ./examples/samsung-br/
# → Gera .well-known/pkp/catalog.json + products/ + pkp.txt

# Serve localmente
npx pkp serve ./examples/samsung-br/
# → http://localhost:3000/.well-known/pkp/catalog.json
# → Testável com curl, browser, ou agent
```

**Deploy:** Copia `.well-known/pkp/` + `pkp.txt` para VPS. Traefik serve como estático.

```
pkp.kodda.ai/pkp.txt                           ← Ponteiro
pkp.kodda.ai/.well-known/pkp/catalog.json      ← Catálogo demo Kodda
pkp.kodda.ai/.well-known/pkp/products/...      ← 10 PRODUCT.md
```

#### 1.2 — Catalog MCP Server (Semana 4)

Mesma implementação de v0.3 com FastMCP. Alimentado pelo mesmo diretório que gera o estático.

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "pkp-catalog-kodda": {
      "url": "https://pkp.kodda.ai/catalog/mcp"
    }
  }
}
```

#### 1.3 — Registry + Crawler (Semana 5)

O Registry crawla `pkp.kodda.ai/.well-known/pkp/catalog.json` (e qualquer domínio registrado) a cada 30 minutos.

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "pkp-registry": {
      "url": "https://pkp.kodda.ai/registry/mcp"
    }
  }
}
```

#### 1.4 — CLI v1 no npm (Semana 6)

```bash
npm publish  # name: "pkp"
# → npx pkp validate, npx pkp build, npx pkp serve, npx pkp generate
```

**Testes:** Unit + Integration (MCP Inspector) + E2E (Claude Desktop)

**Entregável Fase 1:** As 3 camadas funcionando. Agent consome PKP tanto via HTTP GET (estático) quanto MCP. Demo gravado.

---

### FASE 2 — Escala e Ferramentas (Semana 7-12)

#### 2.1 — Gerar 100 produtos via AI (Semana 7-8)

```bash
npx pkp generate --urls top-100-br.csv --output ./catalog/
npx pkp build ./catalog/
# → Deploy em pkp.kodda.ai/.well-known/pkp/
```

#### 2.2 — Landing Page (Semana 9)

`pkp.kodda.ai`:
- O problema (feed vs PKP — diff visual)
- Como funciona (diagrama 3 camadas)
- "Teste agora" → curl + Claude Desktop config
- "Para fornecedores" → `npx pkp init` + `npx pkp build`
- "Para developers" → GitHub repo + npm
- Spec → link pro GitHub

#### 2.3 — PKP Studio MVP (Semana 10-12)

- Next.js 15 + shadcn/ui
- Auth (magic link)
- Import: CSV/URL → gera PRODUCT.md via AI
- Editor: Monaco + YAML preview
- Validação em tempo real
- **NOVO:** Botão "Download .well-known/pkp/" (zip) para deploy no próprio domínio
- **NOVO:** Opção "Publicar no Kodda MCP" (managed hosting)
- Analytics: queries, produtos mais consultados

#### 2.4 — Open Source (Semana 12)

Publicar `github.com/koddaai/pkp`:
- README com visão geral
- SPEC.md formal
- @pkprotocol/spec no npm
- CLI (pkp) no npm
- Skills (publicadas também em skills.sh):
  - `pkp-consumer` (como consumir PKP)
  - `pkp-smartphones`, `pkp-notebooks` (como comparar por categoria)
  - `pkp-product-explainer` (traduzir specs para leigos)
  - `brazilian-ecommerce` (e-commerce BR para agents)
- Catalog server de referência
- 100 produtos de exemplo
- Guia: "Como publicar PKP no seu domínio em 5 minutos"
- Guia: "Como conectar um agent ao PKP"

---

## 5. Critérios de Sucesso e KPIs

### Fim da Fase 1 (Semana 6)

| Métrica | Alvo |
|---------|------|
| `pkp.kodda.ai/.well-known/pkp/catalog.json` serve | ✅ |
| `npx pkp validate` funciona | ✅ |
| Catalog MCP Server online | ✅ |
| Registry MCP Server online | ✅ |
| Claude Desktop consumindo PKP | ✅ (demo gravado) |
| Produtos no catálogo | 10+ |
| Categorias com schema | 5 |
| Skills core publicadas em skills.sh | 4+ (consumer, smartphones, notebooks, product-explainer) |
| Latência GET catalog.json | < 100ms |

### Fim da Fase 2 (Semana 12)

| Métrica | Alvo |
|---------|------|
| Produtos PKP publicados | 100+ |
| Landing page live | ✅ |
| PKP Studio MVP | ✅ |
| Spec no GitHub (público) | ✅ |
| CLI no npm | ✅ |
| Skills publicadas em skills.sh | 7 (todas) |

### KPIs Operacionais (ongoing)

| KPI | O que mede |
|-----|-----------|
| **HTTP GETs em /.well-known/pkp/** | Adoção por agents (Camada 1) |
| **MCP calls / dia** | Adoção por agents (Camada 2) |
| **Domínios com /.well-known/pkp/** | Adoção por fornecedores |
| **% produtos com confidence ≥ medium** | Qualidade do catálogo |
| **Latência P95 do Registry** | Performance |

---

## 6. Roadmap Futuro

| Item | Quando | Trigger |
|------|--------|---------|
| Integração AP2 demo (PKP → pagamento) | Fase 2+ | Quando AP2 tiver sandbox pública |
| Crawler automático de novos domínios | Fase 2+ | Quando tiver 5+ domínios |
| Skill B para 10+ categorias | Fase 2+ | Quando tiver demanda por novas categorias |
| Delta sync (updated_since) | Fase 2+ | Quando tiver 500+ produtos |
| Score de reputação para publishers | Fase 3+ | Quando tiver 10+ domínios |
| Federated search em tempo real | Fase 3+ | Quando tiver 10+ catálogos MCP |
| Propor spec para standards body | Fase 3+ | Quando tiver tração comprovada |
| Plugin WordPress/Shopify | Fase 3+ | Quando fornecedores pedirem |

---

## 7. Resumo da Mudança v0.3 → v0.4 → v0.4.3

| Aspecto | v0.3 | v0.4 | v0.4.2 | v0.4.3 |
|---------|------|------|--------|--------|
| **Onde dados ficam** | MCP Server Kodda | Domínio fornecedor | = | = |
| **Como agent acessa** | Conecta via MCP | HTTP GET ou MCP | = | = |
| **Discovery** | N/A | N/A | N/A | **pkp.txt na raiz (ponteiro)** |
| **Skills** | N/A | skill.md única | 3 camadas (A/B/C) | **Kodda-owned (skills.sh). Sem Skill C** |
| **Narrativa fornecedor** | N/A | N/A | Skill C no domínio | **Campos no PRODUCT.md (highlights, preferred_terms)** |
| **Estrutura domínio** | N/A | catalog + skill + products | + pasta skills/ | **catalog + products (só dados)** |
| **Variantes** | N/A | N/A | family_id/variant_of | = |
| **Identificadores** | sku + gtin | sku + gtin | identifiers[] | = |
| **Completeness** | Global 60% | Global 60% | Por categoria | = |
| **Conflito fontes** | Não tratado | publisher.type | Algoritmo formal | = |
| **AP2** | N/A | purchase_urls | + disclaimer | = |
| **Custo MVP** | ~$20 | ~$5 | ~$5 | ~$5 |

---

*Kodda Serviços de Inteligência Artificial LTDA*
*CNPJ: 63.644.444/0001-80*
