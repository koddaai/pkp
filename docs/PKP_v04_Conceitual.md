# Product Knowledge Protocol (PKP)
## O padrão aberto de conhecimento de produto para AI agents

**Autor:** Pedro / Kodda.ai
**Data:** 06 de fevereiro de 2026
**Status:** Draft v0.4.3 — Documento Conceitual
**Changelog:**
- v0.2: revisão estratégica (agent-first, separação formato/transporte, confidence levels, flywheel corrigido)
- v0.3: patch crítico (modelo de preço realista, claim endurecido, freshness, quality gates, versionamento de schema)
- v0.4: **mudança arquitetural** — modelo web-native (`.well-known/pkp/`), inspirado em llms.txt/robots.txt. Integração com AP2. Agent Skill de consumo.
- v0.4.1: Product URI canônico (`pkp://{domain}/{sku}`), regras de canonicidade, segurança de skill.md, catalog shards spec, catalog_updated_at no Registry
- v0.4.2: Variantes (family_id/variant_of), identifiers[] multi-padrão, completeness por categoria, precedência formal de skills, algoritmo canônico
- v0.4.3: **Skills 100% Kodda-owned** (publicadas em skills.sh, fornecedor não publica skills). Skill C eliminada — narrativa do fornecedor vira campos no PRODUCT.md (`highlights`, `preferred_terms`). Estrutura no domínio simplificada (sem pasta skills/). Adicionado `pkp.txt` como ponteiro na raiz.

---

## 1. Resumo Executivo

O ecossistema de agentic commerce está se consolidando rapidamente. Em janeiro de 2026, o Google lançou o Universal Commerce Protocol (UCP) com Shopify, Walmart, Target e mais de 20 parceiros. Em setembro de 2025, o Google anunciou o Agent Payments Protocol (AP2) com 60+ parceiros (Mastercard, PayPal, Adyen, Coinbase). OpenAI e Stripe mantêm o Agentic Commerce Protocol (ACP). A Anthropic abriu o padrão Agent Skills e o Model Context Protocol (MCP).

**Todos esses protocolos resolvem a transação — como um agente descobre, compra e paga.** Mas nenhum deles resolve um problema anterior e fundamental:

> **Como descrever produtos de forma que qualquer AI agent consiga entender, comparar, recomendar e vender — sem integração customizada?**

O **Product Knowledge Protocol (PKP)** é um **formato aberto** + **schemas por categoria** para representar conhecimento de produto de forma que qualquer AI agent possa consumir.

### A mudança fundamental na v0.4: Web-native

O PKP adota o modelo de distribuição da web aberta:

**Cada marca/fornecedor hospeda seus dados PKP no próprio domínio**, no caminho `/.well-known/pkp/`, assim como `robots.txt`, `sitemap.xml` e `llms.txt` ficam no domínio de quem publica.

```
samsung.com.br/.well-known/pkp/catalog.json     ← índice de produtos
samsung.com.br/.well-known/pkp/products/galaxy-s25-ultra.md  ← PRODUCT.md
```

**AI agents vão até o domínio e consultam.** Não é o fornecedor que "publica em algum lugar" — é o agent que "visita e lê".

Isso muda tudo:
- **Zero dependência de infraestrutura centralizada** — dados vivem no domínio do fornecedor
- **Controle total do fornecedor** — edita no seu servidor, effect imediato
- **Descobrível por qualquer agent** — mesmo sem MCP, basta fazer HTTP GET
- **Mesma dinâmica da web** — robots.txt, sitemap.xml, llms.txt, agora pkp/

### O Stack Completo de Agentic Commerce

| Camada | Protocolo | Quem Resolve | Status |
|--------|-----------|-------------|--------|
| **Pagamento** | AP2 (Google/60+ partners) | Como pagar com segurança | Lançado (set/2025) |
| **Transação** | UCP (Google/Shopify) | Como comprar | Lançado |
| **Orquestração** | A2A (Google), MCP (Anthropic) | Como agentes se comunicam | Lançado |
| **Capacidades** | Agent Skills (Anthropic/Vercel) | Como agentes executam tarefas | Lançado |
| **Conhecimento de Produto** | **PKP** | Como agentes entendem produtos | **← É ISSO** |

**O PKP é a camada que falta.** AP2 resolve "como pagar". UCP resolve "como comprar". PKP resolve "o que comprar e por quê" — a etapa que vem antes de tudo.

### Distinção fundamental: PKP é formato, não protocolo

| | PKP | MCP | AP2 |
|--|-----|-----|-----|
| **O que é** | Formato de dados de produto | Protocolo de comunicação agent↔sistema | Protocolo de pagamento agent↔merchant |
| **Analogia** | HTML (conteúdo) | HTTP (transporte) | HTTPS + TLS (transação segura) |
| **Distribuição** | `.well-known/pkp/` (primário), MCP, REST, CDN | SDK, runtime | A2A extension, MCP extension |
| **Depende de** | Nada — é um arquivo no servidor | Runtime, SDK | VDCs, crypto, mandates |

**Na prática:** Um agent usa PKP para entender o produto, MCP para se comunicar com sistemas, e AP2 para executar o pagamento. São camadas complementares.

---

## 2. O Modelo de Distribuição

### 2.1 Web-native: `.well-known/pkp/`

Inspirado em padrões web consolidados:

| Padrão | Localização | Propósito |
|--------|-------------|-----------|
| `robots.txt` | `/robots.txt` | Instruções para crawlers |
| `sitemap.xml` | `/sitemap.xml` | Mapa de páginas para search engines |
| `llms.txt` | `/llms.txt` | Conteúdo curado para LLMs |
| **`pkp/`** | **`/.well-known/pkp/`** | **Dados de produto estruturados para AI agents** |

#### Estrutura no domínio do fornecedor

```
samsung.com.br/
├── pkp.txt                          ← Ponteiro (opcional): indica que o domínio publica PKP
├── .well-known/
│   └── pkp/
│       ├── catalog.json             ← Índice (lista de produtos com L0)
│       └── products/
│           ├── galaxy-s25-ultra.md  ← PRODUCT.md completo
│           ├── galaxy-s25.md
│           └── galaxy-tab-s10.md
├── robots.txt
├── llms.txt
└── sitemap.xml
```

> **Authority vs Ownership:** Publicar PKP em um domínio prova controle técnico do domínio, não autoridade de marca. Um distribuidor autorizado pode publicar PKP em `distribuidora.com.br`, mas isso não o torna fonte canônica do fabricante. A autoridade real é determinada pela combinação de `publisher.type` (manufacturer > retailer > aggregator > community), campo `canonical` (aponta para fonte oficial), e `confidence.source`. Domínio é prova de ownership técnico; autoridade é prova de proximidade com a verdade. O PKP não tenta resolver disputas legais de marca — apenas fornece mecanismos para que agents identifiquem a fonte mais confiável.

#### O arquivo `catalog.json` (índice)

```json
{
  "schema": "pkp/1.0",
  "publisher": {
    "name": "Samsung Brasil",
    "type": "manufacturer",
    "domain": "samsung.com.br",
    "contact": "produtos@samsung.com.br"
  },
  "categories": ["celulares/smartphones", "tablets", "tvs"],
  "total_products": 47,
  "updated_at": "2026-02-06T12:00:00Z",
  "products": [
    {
      "sku": "SM-S926BZKDZTO",
      "name": "Galaxy S25 Ultra 256GB",
      "category": "celulares/smartphones",
      "summary": "Smartphone premium com S Pen, câmera 200MP, Snapdragon 8 Elite",
      "price": { "type": "msrp", "currency": "BRL", "value": 9499.00 },
      "confidence_source": "manufacturer",
      "url": "/.well-known/pkp/products/galaxy-s25-ultra.md",
      "updated_at": "2026-02-06T12:00:00Z"
    }
  ]
}
```

Agents fazem `GET samsung.com.br/.well-known/pkp/catalog.json` para descobrir todos os produtos. Depois `GET` no PRODUCT.md específico quando precisam de detalhes.

#### O arquivo `pkp.txt` (ponteiro na raiz — opcional)

Um arquivo de texto simples na raiz do domínio que indica suporte ao PKP:

```
# PKP (Product Knowledge Protocol)
# Dados estruturados de produto para AI agents
# Spec: github.com/koddaai/pkp

catalog: /.well-known/pkp/catalog.json
```

É um ponteiro, não contém dados. Qualquer agent que olhe a raiz do domínio descobre que PKP está disponível. Agents que já conhecem `.well-known/` vão direto no `catalog.json`.

#### Agent Skills — Publicadas pela Kodda

As skills PKP são publicadas e mantidas pela Kodda, no modelo do skills.sh (Anthropic Agent Skills). Assim como a Anthropic publicou skills de PDF e Excel que todo mundo usa, a Kodda publica skills de commerce que qualquer agent usa.

**O fornecedor não publica skills. O fornecedor publica dados.**

```
CORE (funcionam com dados PKP)
├── pkp-consumer              "Como descobrir e ler dados PKP"
├── pkp-{category}            "Como comparar smartphones / notebooks / etc"
├── pkp-price-tracker         "Esse preço tá bom? É hora de comprar?"
├── pkp-gift-finder           "Me ajuda a escolher um presente"
├── pkp-product-explainer     "O que significa 200MP? E IP68?"

ECOSSISTEMA (posicionam Kodda além do PKP)
├── brazilian-ecommerce       "PIX parcelado, frete, Procon, direitos"
└── product-review-analyst    "Sintetizar e interpretar reviews"
```

Publicadas em: `skills.sh/kodda/pkp-consumer`, `skills.sh/kodda/pkp-smartphones`, etc.
Repo: `github.com/koddaai/pkp/skills/`

---

##### 1. pkp-consumer (core — obrigatória)

**O que faz:** Ensina qualquer agent a descobrir, ler e interpretar dados PKP.
**Quem usa:** Todo agent que consome PKP.

```markdown
---
name: pkp-consumer
description: "Skill para descobrir e consumir dados de produto no formato PKP"
version: "1.0"
author: "Kodda.ai"
type: "consumer"
---

# Como consumir dados PKP

## Discovery
1. Para qualquer domínio, tente `GET {domain}/.well-known/pkp/catalog.json`
2. Alternativamente, verifique se existe `{domain}/pkp.txt` apontando para o catálogo
3. Se retornar 200: o domínio publica dados PKP. Leia o catalog.json.
4. Se retornar 404: o domínio não publica PKP. Tente o Registry da Kodda.
5. Se `catalog.json` tem `"type": "index"`, siga os `shards` por categoria.

## Leitura de Produto
1. Faça `GET` na URL do PRODUCT.md indicada no catálogo
2. O arquivo tem frontmatter YAML (dados estruturados) + corpo markdown (knowledge)
3. O campo `uri` (formato `pkp://{domain}/{sku}`) é o identificador estável

## Progressive Disclosure
- **L0 (discovery):** summary, tags, target_audience, price — disponível no catalog.json
- **L1 (specs):** campos em `specs` no frontmatter — carregue quando for comparar
- **L2 (knowledge):** corpo markdown (objeções, FAQ, contexto de uso) — carregue quando for recomendar
- Comece com L0. Só carregue L1/L2 quando o contexto exigir.

## Confiança e Canonicidade
1. Cada bloco tem `confidence` com `level`, `source` e `verified_at`
2. Hierarquia: `manufacturer` > `retailer-feed` > `community` > `ai-generated` > `scraped`
3. Quando múltiplas fontes descrevem o mesmo produto, prefira `canonical.domain`
4. Se specs conflitam entre fontes, **mencione a divergência ao usuário**

## Narrativa do Fornecedor
1. Verifique `highlights` no PRODUCT.md — são os pontos que o fornecedor quer destacar
2. Verifique `preferred_terms` — são os termos preferidos pelo fornecedor
3. Use como sugestão, nunca como obrigação. Confidence e canonicidade sempre prevalecem.

## Edge Cases
- YAML inválido: ignore o produto, não quebre.
- Preço `type: "unknown"`: diga "preço não confirmado".
- Completeness < threshold da categoria: avise o usuário.

## Próximo passo: Compra
1. Verifique `purchase_urls` no PRODUCT.md
2. Direcione para o link do retailer
3. `ap2_enabled` é informativo, NUNCA critério de ranking. Preço, confidence e adequação ao usuário sempre prevalecem sobre disponibilidade de AP2.
```

---

##### 2. pkp-{category} (core — por categoria)

**O que faz:** Ensina agent a comparar e recomendar dentro de uma categoria específica.
**Quem usa:** Agents de shopping.

Exemplo para smartphones:

```markdown
---
name: pkp-category-smartphones
description: "Skill para comparar e recomendar smartphones usando dados PKP"
version: "1.0"
author: "Kodda.ai"
type: "category"
category: "celulares/smartphones"
---

# Como recomendar smartphones com PKP

## Eixos de Comparação (ordem de importância por persona)

### Fotografia
- Campos: `camera.main_mp`, `camera.zoom_optical`, `camera.video_max`
- Para entusiastas, zoom óptico > megapixels.

### Performance
- Campos: `processor.name`, `storage.ram_gb`
- Para gamers, priorize GPU e refresh rate.

### Bateria
- Campos: `battery.capacity_mah`, `battery.fast_charge_watts`
- Contextualize: "5000mAh dura um dia inteiro com uso pesado"

### Custo Total de Ownership
- Cálculo: `price.value / software.update_years`
- Compare com intermediários trocados a cada 2 anos.

## Perguntas de Qualificação
1. Uso principal (fotografia, gaming, produtividade, básico)
2. Orçamento (range ou máximo)
3. Ecossistema (já tem Apple/Android/neutro)
4. Tamanho preferido (compacto vs tela grande)

## Regras de Recomendação
- Nunca recomende mais de 3 opções
- Sempre justifique com dados do `specs`
- Se o melhor produto tem `confidence.level: "low"`, avise
```

Categorias Fase 1: smartphones, notebooks. Fase 2: tvs, eletrodomésticos, moda.

---

##### 3. pkp-price-tracker (core)

**O que faz:** Ensina agent a avaliar se um preço está bom e se é hora de comprar.
**Quem usa:** Agents de shopping, especialmente Bia Garimpa.

```markdown
---
name: pkp-price-tracker
description: "Skill para analisar preços e recomendar momento de compra usando dados PKP"
version: "1.0"
author: "Kodda.ai"
type: "utility"
---

# Como avaliar preços com PKP

## Dados disponíveis
1. `price.type`: msrp (sugerido fabricante), street (praticado), range (faixa), unknown
2. `price.value` / `price.min` / `price.max`: valores atuais
3. `price.source`: manufacturer, retailer, inferred
4. `price.updated_at`: quando o preço foi registrado
5. `purchase_urls[]`: lista de retailers com preços diferentes

## Análise de preço
1. Compare `price.value` com `price.map` (preço mínimo anunciado) — se existir
2. Se múltiplos retailers: calcule média, identifique o menor preço
3. Calcule desconto vs MSRP: `(msrp - street) / msrp * 100`
4. Se `price.updated_at` > 7 dias, avise: "preço pode estar desatualizado"

## Custo Total de Ownership
1. Para eletrônicos: `price.value / software.update_years` = custo anual
2. Para eletrodomésticos: considere consumo energético se disponível em specs
3. Contextualize: "R$9.499 com 7 anos = R$1.357/ano, menos que trocar a cada 2 anos"

## Momento de compra
1. Próximo de datas promocionais (Black Friday, Prime Day): sugira esperar se < 30 dias
2. Produto recém-lançado: preço tende a cair nos primeiros 3-6 meses
3. Se `price.type: "range"` e a diferença é grande: vale pesquisar mais

## Regras
- Nunca garanta que preço vai cair — diga "historicamente tende a..."
- Se `price.type: "unknown"`, diga "não temos preço confirmado"
- Sempre sugira comparar em pelo menos 2 retailers
```

---

##### 4. pkp-gift-finder (core)

**O que faz:** Ensina agent a recomendar presentes com base em persona e ocasião.
**Quem usa:** Agents de shopping em contexto de presente.

```markdown
---
name: pkp-gift-finder
description: "Skill para recomendar presentes usando dados PKP"
version: "1.0"
author: "Kodda.ai"
type: "utility"
---

# Como recomendar presentes com PKP

## Perguntas de Qualificação
Antes de qualquer recomendação, descubra:
1. **Para quem?** (relação: parceiro, mãe/pai, amigo, colega, filho)
2. **Idade aproximada?** (criança, adolescente, adulto jovem, adulto, idoso)
3. **Orçamento?** (range ou máximo)
4. **Ocasião?** (aniversário, Natal, Dia das Mães/Pais, casamento, sem motivo)
5. **Interesses conhecidos?** (tecnologia, moda, esportes, casa, leitura)

## Mapeamento persona → campos PKP
- Use `target_audience` para match com a persona do presenteado
- Use `use_cases` para match com interesses conhecidos
- Use `price.value` para filtrar por orçamento
- Use `category` para diversificar (não sugira 3 smartphones)

## Sazonalidade
- **Natal (dez):** orçamento maior, presentes premium
- **Dia das Mães (mai):** eletro, beleza, experiências
- **Dia dos Pais (ago):** tech, ferramentas, esportes
- **Dia dos Namorados (jun BR):** personalizado, experiências
- **Black Friday (nov):** oportunidade de "presente adiantado" com desconto

## Regras de Recomendação
- Sugira 2-3 opções em faixas de preço diferentes
- Sempre justifique: "Para quem gosta de fotografia, o X tem câmera 200MP..."
- Se não tem dados PKP para a persona, diga que as opções são limitadas
- Nunca recomende produto com `confidence.level: "low"` como presente — risco de frustração
```

---

##### 5. pkp-product-explainer (core)

**O que faz:** Ensina agent a traduzir especificações técnicas em linguagem acessível.
**Quem usa:** Qualquer agent que explique produtos para consumidores leigos.

```markdown
---
name: pkp-product-explainer
description: "Skill para explicar especificações técnicas de produtos em linguagem simples"
version: "1.0"
author: "Kodda.ai"
type: "utility"
---

# Como explicar specs técnicas com PKP

## Princípio
Specs existem para comparação entre agents. Mas quando o usuário pergunta "o que isso significa?",
o agent precisa traduzir para linguagem cotidiana.

## Smartphones
- **200MP:** "Fotos com altíssimo detalhe. Na prática, usa pixel binning para fotos de ~12MP com qualidade excepcional em baixa luz, mas permite zoom digital sem perda de qualidade."
- **IP68:** "Resiste a submersão em 1.5m de água por 30 minutos. Pode usar na chuva e sobrevive a uma queda na piscina."
- **120Hz refresh rate:** "A tela atualiza 120 vezes por segundo. Scrolling e animações ficam muito mais suaves. Perceptível especialmente em redes sociais e games."
- **5000mAh:** "Bateria grande. Na prática, dura um dia inteiro com uso moderado-pesado (redes sociais, streaming, câmera)."
- **45W fast charge:** "Carrega de 0 a 50% em ~30 minutos. De 50% a 100% é mais lento (proteção da bateria)."
- **Snapdragon 8 Elite:** "Processador topo de linha da Qualcomm. Roda qualquer app ou jogo sem engasgar."

## Notebooks
- **M4 chip:** "Processador Apple, excelente eficiência energética. Bateria dura mais que concorrentes Intel equivalentes."
- **16GB RAM unificada:** "Memória compartilhada entre CPU e GPU. 16GB é suficiente para produtividade pesada e edição leve de vídeo."
- **Retina display:** "Tela de altíssima resolução onde pixels individuais não são visíveis. Texto e imagens ficam muito nítidos."

## TVs
- **OLED vs QLED:** "OLED tem preto perfeito (pixels desligam individualmente). QLED é mais brilhante em ambientes claros. OLED para cinema, QLED para sala iluminada."
- **4K:** "Resolução de 3840x2160 pixels. Diferença visível em telas acima de 50 polegadas ou quando sentado perto."
- **HDR10+/Dolby Vision:** "Mais contraste e cores em conteúdo compatível (Netflix, Disney+). Dolby Vision é dinâmico (ajusta cena a cena)."

## Regra geral
1. Sempre dê o número técnico + tradução prática
2. Use analogias do cotidiano quando possível
3. Se o campo `specs` não tem um valor que o usuário perguntou, diga "essa informação não está disponível nos dados"
4. Use a seção L2 (knowledge/FAQ) do PRODUCT.md — frequentemente já tem explicações prontas
```

---

##### 6. brazilian-ecommerce (ecossistema)

**O que faz:** Ensina agent a navegar o ecossistema de e-commerce brasileiro.
**Quem usa:** Qualquer agent que opere no mercado BR.

```markdown
---
name: brazilian-ecommerce
description: "Skill para navegar o ecossistema de e-commerce brasileiro: pagamentos, frete, direitos do consumidor"
version: "1.0"
author: "Kodda.ai"
type: "ecosystem"
market: "BR"
---

# E-commerce Brasileiro para AI Agents

## Pagamentos
- **PIX:** Transferência instantânea, sem taxa para consumidor. Muitos e-commerces dão 5-15% de desconto no PIX.
- **PIX parcelado:** Novidade — parcela o PIX via crédito. Disponível em Mercado Pago, PicPay, etc.
- **Cartão parcelado:** Padrão brasileiro. "10x sem juros" é comum e esperado. Juros começam em 12x+.
- **Boleto bancário:** Ainda existe, desconto similar ao PIX. Prazo de compensação: 1-3 dias úteis.

## Frete
- **Frete grátis:** Muitos e-commerces oferecem acima de R$100-200. É critério de decisão forte.
- **Prazo de entrega:** Varia muito por região. SP/RJ: 1-3 dias. Norte/Nordeste: 5-15 dias.
- **Logística reversa:** Direito do consumidor de devolver em 7 dias (compra online). Frete de devolução por conta do vendedor.

## Direitos do Consumidor (CDC)
- **Arrependimento (Art. 49):** 7 dias para devolver compra online, sem justificativa. Reembolso total.
- **Garantia legal:** 30 dias (não duráveis), 90 dias (duráveis). Além da garantia contratual do fabricante.
- **Vício do produto:** Se defeito em 30 dias, loja deve trocar, devolver dinheiro ou consertar.
- **Procon:** Órgão de defesa do consumidor. Reclamação gratuita. Reclame Aqui não é oficial mas tem peso.

## Marketplaces Principais
- **Mercado Livre:** Maior marketplace BR. Envio rápido (Full), proteção ao comprador.
- **Amazon BR:** Crescendo rápido. Prime com frete grátis. Marketplace + produtos próprios.
- **Magazine Luiza / Magalu:** Forte em eletro e eletrônicos. Loja física + digital.
- **Americanas / Shopee / AliExpress:** Mais acessíveis, prazos maiores.

## Datas Promocionais
- **Black Friday (nov):** Maior data. Descontos reais + maquiados. Verificar histórico de preço.
- **Dia do Consumidor (15/mar):** "Black Friday do primeiro semestre"
- **Prime Day (jul):** Amazon exclusivo
- **11.11:** Shopee/AliExpress

## Regras para Agents
- Sempre mencione opção PIX quando existir (desconto frequente)
- Para compras grandes, sugira verificar se o frete é grátis
- Se o usuário quer devolver: informe o direito de 7 dias (Art. 49)
- Nunca recomende parcelamento com juros sem avisar explicitamente
```

---

##### 7. product-review-analyst (ecossistema)

**O que faz:** Ensina agent a sintetizar e interpretar reviews de produtos.
**Quem usa:** Agents que complementam dados PKP com percepção de mercado.

```markdown
---
name: product-review-analyst
description: "Skill para interpretar e sintetizar reviews de produtos"
version: "1.0"
author: "Kodda.ai"
type: "utility"
---

# Como interpretar reviews de produtos

## Dados de Review (quando disponíveis no PRODUCT.md)
Alguns PRODUCT.md incluem dados agregados de review:
```yaml
reviews:
  average_rating: 4.6
  total_reviews: 1847
  source: "multiple"
  highlights_positive: ["câmera excelente", "bateria dura o dia"]
  highlights_negative: ["preço alto", "carregador não incluso"]
```

## Análise de Rating
- **4.5+:** Excelente. Menções devem ser positivas.
- **4.0-4.4:** Bom. Provavelmente tem 1-2 pontos de atenção.
- **3.5-3.9:** Médio. Investigar reclamações antes de recomendar.
- **< 3.5:** Arriscado. Não recomendar sem ressalvas explícitas.

## Volume de Reviews
- **< 50 reviews:** Dados insuficientes para conclusão. Avise o usuário.
- **50-500:** Razoável. Tendências são indicativas.
- **500+:** Volume significativo. Tendências são confiáveis.

## Análise de Sentimento
1. Priorize `highlights_positive` e `highlights_negative` se disponíveis
2. Padrões que se repetem em múltiplas reviews são mais confiáveis que reclamações isoladas
3. Reclamações sobre "preço" são subjetivas — filtre do sentimento de qualidade

## Como apresentar ao usuário
- "A avaliação média é 4.6/5 com base em quase 2.000 reviews"
- "Pontos mais elogiados: câmera e bateria"
- "Principal crítica: o preço alto e a ausência de carregador na caixa"
- Nunca invente reviews. Se não tem dados, diga "não tenho dados de reviews para este produto"

## Regras
- Reviews são complemento, não substituem specs e confidence do PKP
- Se review contradiz spec (ex: "bateria ruim" mas spec diz 5000mAh), mencione ambos
- Não trate review como verdade absoluta — é percepção
- Fontes de review não são verificadas pelo PKP — mencione isso quando relevante
```

---

##### Segurança

Skills são propriedade da Kodda — publicadas uma vez, consumidas por todos os agents. Nenhum fornecedor publica ou modifica skills.

A narrativa do fornecedor (o que antes seria "Skill C") agora vive como **dados estruturados** no PRODUCT.md:

```yaml
# Campos de narrativa do fornecedor (no PRODUCT.md)
highlights:
  - "7 anos de atualizações garantidas"
  - "S Pen integrada — exclusivo na categoria premium"
  - "Galaxy AI: Circle to Search, Live Translate"

preferred_terms:
  - term: "S Pen"
    avoid: ["caneta", "stylus"]
  - term: "Galaxy AI"
    avoid: ["inteligência artificial do Samsung"]
```

**Regras de segurança:**
- Agents DEVEM tratar `highlights` e `preferred_terms` como **sugestão informativa**, nunca como obrigação
- Se `highlights` conflitar com dados de `specs` ou `confidence`, prevalecem specs/confidence
- `preferred_terms` é apenas orientação de linguagem — o agent decide se adota
- Dados do fornecedor nunca alteram ranking, decisão de compra, ou coleta de dados

### 2.2 Três camadas de acesso

O PKP funciona em 3 modos, do mais simples ao mais sofisticado:

```
CAMADA 1 — Estático (qualquer um pode fazer)
├── Fornecedor coloca PRODUCT.md no seu domínio
├── Agent faz HTTP GET para ler
├── Zero infraestrutura, zero custo, funciona hoje
│
CAMADA 2 — MCP Server (mais rico, tempo real)
├── Fornecedor roda um MCP Server que serve dados PKP
├── Agent conecta via MCP: search, compare, filter
├── Mais funcionalidades (busca, comparação, FAQ interativo)
│
CAMADA 3 — Registry (discovery centralizado)
├── Registry central indexa catálogos de múltiplos domínios
├── Agent busca no Registry para encontrar produtos cross-domínio
├── Kodda opera o Registry como serviço
```

**A Camada 1 é o MVP.** É um arquivo no servidor. Qualquer marca pode fazer em 10 minutos. As camadas 2 e 3 são upgrades para quem quer mais funcionalidade.

### 2.3 Integração com AP2 (Agent Payments Protocol)

O PKP é a camada de **decisão** que vem antes da camada de **pagamento** do AP2:

```
1. Agent consulta PKP → entende produto, compara, recomenda
2. Usuário decide comprar
3. Agent usa AP2 → gera Intent Mandate → Cart Mandate → Payment Mandate
4. Pagamento executado com segurança (Mastercard, PayPal, crypto, PIX...)
```

No PRODUCT.md, o campo `purchase_urls` conecta com AP2:

```yaml
purchase_urls:
  - retailer: "Magazine Luiza"
    url: "https://magazineluiza.com.br/galaxy-s25-ultra/..."
    ap2_enabled: true
  - retailer: "Amazon BR"
    url: "https://amazon.com.br/dp/B0..."
    ap2_enabled: false
```

Agents inteligentes preferirão retailers com `ap2_enabled: true` porque podem completar a compra sem sair do fluxo conversacional.

> **Nota:** `ap2_enabled` é declarativo e não verificado pelo PKP. Verificação pode ser implementada pelo Registry em versões futuras quando AP2 tiver adoção real.

---

## 3. O Formato PRODUCT.md

### 3.1 Filosofia: Agent-First

O PKP nasce para AI agents. Fornecedores são convidados a assumir e enriquecer seus dados, mas o ecossistema funciona antes disso.

1. **Catálogos PKP podem ser criados por qualquer parte** — o próprio agent, um agregador, a comunidade, ou o fornecedor.
2. **Fornecedores ganham incentivo progressivo** — quando seus produtos estão representados por terceiros (com `confidence.source: "ai-generated"`), eles têm incentivo para publicar a versão oficial (`confidence.source: "manufacturer"`).
3. **A dinâmica é a mesma do Google Meu Negócio** — o Google colocou restaurantes no Maps sem pedir. Restaurantes foram lá corrigir. Hoje nenhum sobrevive sem perfil atualizado.

### 3.2 Princípios de Design

1. **Web-native:** Dados vivem no domínio do fornecedor. `.well-known/pkp/` é o endereço canônico.
2. **Agent-first:** O formato existe para AI agents consumirem. Funciona antes da adoção por fornecedores.
3. **Formato agnóstico de transporte:** `.well-known/pkp/` (HTTP), MCP Server, REST API, CDN, GitHub — o formato é o mesmo.
4. **Agent-readable, human-writable:** Markdown com frontmatter YAML.
5. **Progressive disclosure:** L0 (discovery), L1 (specs), L2 (knowledge completo).
6. **Confiança explícita:** Cada bloco de dados tem `confidence` (level + source + verified_at).
7. **Comparável por design:** Schemas por categoria garantem comparabilidade entre marcas.
8. **Complementar:** Funciona junto com AP2 (pagamento), UCP (transação), MCP (transporte).

### 3.3 Exemplo Completo: PRODUCT.md

```yaml
---
# === IDENTIDADE ===
schema: pkp/1.0
sku: "SM-S926BZKDZTO"
gtin: "7892509123456"
brand: "Samsung"
name: "Galaxy S25 Ultra 256GB"
category: "celulares/smartphones"
subcategory: "smartphones-premium"

# === IDENTIFICADORES ADICIONAIS (opcionais) ===
identifiers:
  mpn: "SM-S926BZKDZTO"              # Manufacturer Part Number
  ean: "7892509123456"                # = GTIN neste caso
  # asin: "B0..."                     # Amazon Standard ID (quando aplicável)

# === VARIANTES (opcional — para produtos com cor/tamanho/storage) ===
family_id: "galaxy-s25-ultra"          # agrupa todas as variantes deste modelo
variant_of: null                       # null = é o modelo principal (não variante)
variant_attributes: ["storage", "cor"] # eixos de variação
# Para variantes: variant_of: "SM-S926B" (SKU do modelo pai)

# === URI CANÔNICO ===
uri: "pkp://samsung.com.br/SM-S926BZKDZTO"
canonical:
  domain: "samsung.com.br"
  url: "/.well-known/pkp/products/galaxy-s25-ultra.md"

# === DESCOBERTA (L0) ===
summary: "Smartphone premium Samsung com S Pen integrada, câmera 200MP, tela 6.9 AMOLED, chip Snapdragon 8 Elite. Ideal para produtividade, fotografia profissional e multitarefa pesada."
tags: ["smartphone", "samsung", "galaxy", "s-pen", "camera-200mp", "5g", "flagship", "android"]
target_audience: ["profissionais", "entusiastas-fotografia", "power-users"]
use_cases: ["produtividade-mobile", "fotografia", "gaming", "multitarefa"]

# === PREÇO ===
price:
  type: "msrp"
  currency: "BRL"
  value: 9499.00
  map: 8999.00
  source: "manufacturer"
  updated_at: "2026-02-06T12:00:00Z"
availability: "in-stock"
launch_date: "2026-01-22"

# === ONDE COMPRAR ===
purchase_urls:
  - retailer: "Samsung Shop"
    url: "https://shop.samsung.com.br/galaxy-s25-ultra"
    ap2_enabled: false
  - retailer: "Magazine Luiza"
    url: "https://magazineluiza.com.br/..."
    ap2_enabled: false

# === CONFIANÇA DOS DADOS ===
confidence:
  specs:
    level: "high"
    source: "manufacturer"
    verified_at: "2026-02-06T12:00:00Z"
  price:
    level: "high"
    source: "retailer-feed"
    verified_at: "2026-02-06T10:00:00Z"
  alternatives:
    level: "low"
    source: "ai-generated"
    verified_at: "2026-02-01T09:00:00Z"

# === SPECS COMPARÁVEIS (L1) ===
specs:
  display:
    size_inches: 6.9
    technology: "Dynamic AMOLED 2X"
    resolution: "3120x1440"
    refresh_rate_hz: 120
  processor:
    name: "Snapdragon 8 Elite for Galaxy"
    cores: 8
  camera:
    main_mp: 200
    ultrawide_mp: 50
    telephoto_mp: 50
    zoom_optical: 5
    video_max: "8K@30fps"
  battery:
    capacity_mah: 5000
    fast_charge_watts: 45
    wireless_charge: true
  storage:
    internal_gb: 256
    ram_gb: 12
  physical:
    weight_grams: 218
    ip_rating: "IP68"
    has_stylus: true
  software:
    os: "Android 15"
    ui: "One UI 7"
    update_years: 7

# === RELAÇÕES ===
relationships:
  replaces: ["SM-S928BZKDZTO"]
  alternatives:
    - sku: "iphone-16-pro-max"
      brand: "Apple"
      reason: "Ecossistema integrado, melhor para usuários Apple"
    - sku: "pixel-9-pro-xl"
      brand: "Google"
      reason: "Melhor câmera computacional com AI"
  accessories:
    - category: "capas"
      query: "capa Galaxy S25 Ultra"
    - category: "carregadores"
      query: "carregador 45W USB-C Samsung"

# === NARRATIVA DO FORNECEDOR (opcional) ===
highlights:
  - "7 anos de atualizações garantidas"
  - "S Pen integrada — exclusivo na categoria premium"
  - "Galaxy AI: Circle to Search, Live Translate, Generative Edit"
  - "Carregador não incluso na caixa"

preferred_terms:
  - term: "S Pen"
    avoid: ["caneta", "stylus"]
  - term: "Galaxy AI"
    avoid: ["inteligência artificial do Samsung"]

# === REVIEWS AGREGADOS (opcional) ===
reviews:
  average_rating: 4.6
  total_reviews: 1847
  source: "multiple"
  highlights_positive: ["câmera excelente", "bateria dura o dia todo", "S Pen útil"]
  highlights_negative: ["preço alto", "carregador não incluso na caixa"]
---

## Contexto de Uso

### Para quem é ideal
- **Profissionais** que precisam de produtividade mobile com S Pen
- **Entusiastas de fotografia** que querem câmera 200MP com zoom óptico 5x
- **Power users** que exigem performance máxima e multitarefa

### Objeções comuns

**"R$9.499 é caro demais"**
Considerando 7 anos de updates garantidos, o custo anual é R$1.357 — menor que um intermediário trocado a cada 2 anos.

**"200MP é marketing?"**
Não. O sensor Samsung ISOCELL HP2 usa pixel binning de 16:1, resultando em fotos de 12.5MP com qualidade excepcional em baixa luz. Os 200MP reais são usados para zoom digital sem perda.

### FAQ
- **Tem slot para cartão microSD?** Não. Disponível em 256GB, 512GB e 1TB.
- **A S Pen carrega separadamente?** Não, carrega dentro do aparelho.
- **Funciona com eSIM?** Sim, suporta nano SIM + eSIM.
```

### 3.4 Confidence Levels

Cada bloco de dados tem um campo `confidence`:

| Level | Significado | Exemplo |
|-------|-------------|---------|
| `high` | Dados verificados pela fonte autoritativa | Specs publicados pelo fabricante |
| `medium` | Dados de fonte confiável mas não primária | Preço de feed de varejista |
| `low` | Dados inferidos ou gerados | Alternativas sugeridas por AI |

| Source | Confiabilidade | Quem gera |
|--------|---------------|-----------|
| `manufacturer` | ★★★★★ | O próprio fabricante |
| `retailer-feed` | ★★★★ | Feed de varejista/afiliado |
| `community` | ★★★ | Contribuidores da comunidade |
| `ai-generated` | ★★ | Gerado por LLM |
| `scraped` | ★ | Extraído de página web |

Agents inteligentes usam confidence para:
- Preferir dados `manufacturer` sobre `ai-generated`
- Avisar o usuário quando a confiança é baixa
- Decidir se vale buscar fonte mais confiável

### 3.5 Schemas por Categoria

Cada categoria define campos obrigatórios e recomendados para garantir comparabilidade:

```yaml
# schema: celulares/smartphones
required_specs:
  - display.size_inches
  - processor.name
  - camera.main_mp
  - battery.capacity_mah
  - storage.internal_gb
  - storage.ram_gb
  - physical.weight_grams
  - software.os
comparison_axes:
  - name: "Câmera"
    fields: ["camera.main_mp", "camera.zoom_optical", "camera.video_max"]
  - name: "Performance"
    fields: ["processor.name", "storage.ram_gb"]
  - name: "Bateria"
    fields: ["battery.capacity_mah", "battery.fast_charge_watts"]
```

Categorias iniciais: celulares, notebooks, TVs, eletrodomésticos, moda, beleza, casa, esportes, games, informática.

### 3.6 Modelo de Preço Realista

```yaml
price:
  type: msrp | street | range | unknown
  currency: BRL
  value: 9499.00       # para msrp ou street
  min: 7999.00          # para range
  max: 9499.00          # para range
  source: manufacturer | retailer | inferred
  updated_at: ISO-8601
```

`unknown` é permitido — melhor ser honesto do que forçar um dado falso.

### 3.7 Versionamento de Schema

- `schema: pkp/1.0` — campo obrigatório que identifica a versão
- Campos novos são sempre opcionais
- Mudanças breaking incrementam versão major
- Campos deprecated têm janela mínima de 6 meses
- Agents DEVEM ignorar campos desconhecidos

### 3.8 Quality Gates

- Cada categoria define campos críticos obrigatórios
- Threshold **default** para indexação no Registry: 60% de completeness
- Categorias PODEM definir `min_completeness` específico no schema:
  - Smartphones: 70% (muitos campos obrigatórios)
  - Notebooks: 70%
  - Moda: 50% (menos campos estruturados)
  - TVs: 60%
- Produtos abaixo do threshold da categoria podem existir como draft

### 3.9 Variantes e Identificadores

#### Variantes (family/variant)

Produtos com variações de cor, tamanho ou armazenamento usam campos opcionais:

```yaml
family_id: "galaxy-s25-ultra"          # agrupa todas as variantes
variant_of: null                       # null = modelo principal
variant_attributes: ["storage", "cor"] # eixos de variação
```

- `family_id`: string que agrupa todos os PRODUCT.md de um mesmo modelo
- `variant_of`: SKU do modelo pai (para variantes). `null` se é o modelo principal
- `variant_attributes`: lista dos eixos que variam

Agents usam `family_id` para agrupar variantes na comparação e `variant_attributes` para perguntar ao usuário qual variante prefere.

#### Identificadores multi-padrão

Além de `sku` e `gtin`, o campo `identifiers` aceita múltiplos padrões:

```yaml
identifiers:
  mpn: "SM-S926BZKDZTO"      # Manufacturer Part Number
  ean: "7892509123456"        # European Article Number
  asin: "B0EXAMPLE"           # Amazon Standard ID
  upc: "012345678901"         # Universal Product Code
```

Todos opcionais. O Registry usa `gtin` e `identifiers.mpn` como chaves primárias para cross-domain matching (identificar o mesmo produto em domínios diferentes).

### 3.10 Product URI Canônico

Cada produto tem um identificador único e estável no formato:

```
pkp://{domain}/{sku}
```

Exemplos:
- `pkp://samsung.com.br/SM-S926BZKDZTO`
- `pkp://pkp.kodda.ai/galaxy-s25-ultra-256gb`
- `pkp://kabum.com.br/KB-12345`

O URI permite que agents **referenciem** produtos sem carregar o catálogo inteiro — funciona como um "link" estável entre conversas, comparações e contextos.

Para cross-domain matching (mesmo produto em domínios diferentes), o Registry usa: GTIN > identifiers.mpn > family_id + brand como chaves de deduplicação.

### 3.11 Regras de Canonicidade

Quando múltiplos domínios publicam dados PKP para o mesmo produto (mesmo GTIN ou MPN), o agent deve resolver qual é a fonte canônica.

**Algoritmo de resolução canônica:**

```
RESOLVE_CANONICAL(product_matches[]):
  1. Agrupar por publisher.type
  2. Selecionar o grupo de maior precedência que tenha dados:
     manufacturer > retailer > aggregator > community
  3. Dentro do grupo selecionado:
     a. Se apenas 1 fonte → usar essa
     b. Se múltiplas fontes → selecionar por:
        - maior completeness_score
        - em caso de empate: menor staleness (mais fresco)
  4. Se specs conflitam entre a fonte selecionada e outras:
     → Agent DEVE mencionar a divergência ao usuário
     → Ex: "Segundo dados oficiais da Samsung: X. Segundo dados do Kabum: Y."
  5. Se nenhuma fonte tem confidence.level >= "medium":
     → Agent DEVE avisar: "dados disponíveis têm confiança limitada"
```

O campo `canonical` no PRODUCT.md permite que fontes não-canônicas apontem para a fonte oficial:

```yaml
canonical:
  domain: "samsung.com.br"
  url: "/.well-known/pkp/products/galaxy-s25-ultra.md"
```

Isso diz: "a versão oficial deste produto está em samsung.com.br". O Registry usa esta informação para redirecionar agents.

### 3.11 Escalabilidade do catalog.json

Para catálogos pequenos (< 500 produtos), `catalog.json` é um arquivo único com todos os produtos.

Para catálogos grandes, o `catalog.json` pode funcionar como **índice de shards**:

```json
{
  "schema": "pkp/1.0",
  "type": "index",
  "publisher": { "name": "Magazine Luiza", "type": "retailer", "domain": "magazineluiza.com.br" },
  "total_products": 12847,
  "shards": [
    { "category": "celulares/smartphones", "url": "/.well-known/pkp/catalog/smartphones.json", "count": 342 },
    { "category": "notebooks", "url": "/.well-known/pkp/catalog/notebooks.json", "count": 189 },
    { "category": "tvs", "url": "/.well-known/pkp/catalog/tvs.json", "count": 94 }
  ]
}
```

Cada shard é um `catalog.json` normal com a lista de produtos daquela categoria. Agents e crawlers fazem GET apenas nos shards que precisam.

### 3.12 Segurança de Skills e Narrativa do Fornecedor

**Skills (A e B):** Publicadas e mantidas exclusivamente pela Kodda. Fonte autoritativa é `skills.sh/kodda/` e `github.com/koddaai/pkp/skills/`. Agents DEVEM usar essas versões.

**Narrativa do fornecedor (`highlights` e `preferred_terms`):** São dados estruturados no PRODUCT.md, não skills. Agents DEVEM tratar como sugestão informativa:
- Se `highlights` conflitar com `specs` ou `confidence`, prevalecem specs/confidence
- `preferred_terms` é orientação de linguagem — o agent decide se adota
- Dados do fornecedor nunca alteram ranking, decisão de compra, ou coleta de dados

---

## 4. Como Funciona na Prática

### 4.1 Cenário 1: Agent Bootstrap (Kodda faz)

```
Kodda / Agregador / Comunidade
    │
    ├── 1. Coleta dados públicos de produtos
    │      (site fabricante, feeds afiliados, reviews)
    │
    ├── 2. Gera PRODUCT.md via LLM
    │      confidence.source: "ai-generated"
    │
    ├── 3. Hospeda em domínio da Kodda
    │      pkp.kodda.ai/.well-known/pkp/products/galaxy-s25-ultra.md
    │
    └── 4. Agents consultam via HTTP GET ou MCP Server
         Dados disponíveis imediatamente, com confidence transparente
```

### 4.2 Cenário 2: Fornecedor Publica (web-native)

```
Samsung Brasil
    │
    ├── 1. Cria /.well-known/pkp/ no seu domínio
    │
    ├── 2. Publica catalog.json + PRODUCT.md dos seus produtos
    │      confidence.source: "manufacturer"
    │
    ├── 3. Agents descobrem automaticamente
    │      (crawl ou Registry aponta para samsung.com.br)
    │
    └── 4. Dados oficiais — confidence máxima
         Agents preferem essa versão sobre qualquer ai-generated
```

### 4.3 Cenário 3: Reivindição (claim)

```
Samsung vê seus produtos na Kodda com dados ai-generated
    │
    ├── 1. Publica /.well-known/pkp/ no samsung.com.br
    │      (versão oficial, manufacturer confidence)
    │
    ├── 2. Registry detecta que samsung.com.br tem PKP
    │      (via crawl periódico ou notificação)
    │
    ├── 3. Registry atualiza: fonte canônica = samsung.com.br
    │      dados da Kodda ficam como "mirror" com confidence menor
    │
    └── 4. Agents que consultam Registry são redirecionados
         para a fonte oficial
```

**Nota:** Com o modelo web-native, o "claim" se simplifica. Se a Samsung publica `samsung.com.br/.well-known/pkp/`, ela já é a fonte canônica por definição (prova de domínio implícita). O Registry apenas precisa indexar.

### 4.4 Cenário 4: Compra via AP2

```
Agent (Bia, ChatGPT, Gemini...)
    │
    ├── 1. Consulta PKP → entende Galaxy S25 Ultra
    │      specs, objeções, alternativas, confiança
    │
    ├── 2. Recomenda ao usuário com transparência
    │      "Melhor para fotografia pelo zoom 5x, dados oficiais Samsung"
    │
    ├── 3. Usuário decide comprar
    │
    ├── 4. Agent verifica purchase_urls no PRODUCT.md
    │      Prefere retailer com ap2_enabled: true
    │
    ├── 5. Agent inicia AP2 flow
    │      Intent Mandate → Cart Mandate → Payment Mandate
    │
    └── 6. Compra executada
         Segura, auditável, com prova criptográfica de consentimento
```

---

## 5. O Flywheel

```
Kodda gera PRODUCT.md via AI (confidence: ai-generated)
         │
         ▼
Agents consomem PKP (HTTP GET ou MCP)
Recomendações muito melhores que feeds tradicionais
         │
         ▼
Fornecedores percebem que AI agents descrevem seus produtos
com dados "ai-generated" — não oficiais
         │
         ▼
Fornecedores publicam /.well-known/pkp/ no próprio domínio
confidence sobe para "manufacturer"
Agents preferem essa versão
         │
         ▼
Mais agents adotam PKP (dados oficiais + melhores)
Mais fornecedores publicam (não querem ficar pra trás)
         │
         ▼
PKP se torna padrão de facto para product knowledge
Registry da Kodda é o hub de discovery
         │
         ▼
Kodda monetiza: Studio, Registry analytics, enriquecimento
```

---

## 6. Comparação com Alternativas

| Solução | O que é | Por que não resolve |
|---------|---------|-------------------|
| **Google Shopping Feed** | Feed de listagem (7 campos) | Sem contexto, sem comparabilidade, proprietário Google |
| **llms.txt** | Guia de conteúdo para LLMs | Genérico — não tem schema de produto, confidence, ou comparabilidade |
| **Schema.org Product** | Markup de produto | Para SEO, não para agents. Sem FAQ, objeções, alternativas. |
| **Google Merchant Center** | Atributos expandidos para AI | Proprietário Google. Varejista-first, não fornecedor-first. |
| **PIMs (Akeneo, Salsify)** | Gestão de info de produto | Plataformas fechadas. Dados presos no PIM. |
| **Agent Skills** | Capacidades de agents | Procedural ("como fazer"). PKP é declarativo ("o que existe"). |

### O diferencial do PKP

1. **Web-native** — Vive no domínio do fornecedor, como robots.txt
2. **Agent-first** — Funciona antes da adoção por fornecedores
3. **Confidence explícita** — Agents sabem o quanto confiar em cada dado
4. **Comparável por design** — Schemas por categoria
5. **AP2-ready** — `purchase_urls` com `ap2_enabled` conecta direto com pagamento
6. **Progressive disclosure** — Eficiente em contexto de LLM
7. **Open standard** — Não proprietário de nenhuma plataforma
8. **7 skills Kodda-owned** — Publicadas em skills.sh: consumer, category, price-tracker, gift-finder, product-explainer, brazilian-ecommerce, review-analyst
9. **Canonicidade resolvida** — Product URI + regras de precedência evitam "duas verdades"

---

## 7. Roadmap

### Fase 1 — Spec + Prova de Conceito (6 semanas)

| Entrega | Descrição |
|---------|-----------|
| Spec v1.0 | Formato PRODUCT.md, catalog.json, pkp.txt, confidence, schemas 5 categorias |
| GitHub Repo | `github.com/koddaai/pkp` — spec, exemplos, schemas, validador |
| CLI v1 | `npx pkp validate`, `npx pkp generate`, `npx pkp serve` |
| 100 produtos PKP | Gerados via AI, hospedados em pkp.kodda.ai/.well-known/pkp/ |
| MCP Server | Catalog server de referência (Camada 2) |
| Registry | Indexa catálogos de múltiplos domínios (Camada 3) |
| Skills | 4 skills core publicadas em skills.sh (consumer, smartphones, notebooks, product-explainer) |
| Demo | Vídeo: agent consumindo PKP vs feed raw |

### Fase 2 — Ferramentas e Adoção (10 semanas)

| Entrega | Descrição |
|---------|-----------|
| Landing page | pkp.kodda.ai com spec, exemplos, "teste agora" |
| PKP Studio MVP | Web app para criar/editar/publicar PRODUCT.md |
| CLI publish | `npx pkp publish` gera /.well-known/pkp/ pronto pra deploy |
| 500 produtos | Expandir catálogo para 500 produtos em 10 categorias |
| Skills expandidas | 7 skills totais: + price-tracker, gift-finder, brazilian-ecommerce, review-analyst |
| AP2 demo | Demonstrar fluxo PKP → AP2 de ponta a ponta |

### Fase 3 — Escala (ongoing)

| Entrega | Descrição |
|---------|-----------|
| Parcerias | 3-5 AI shopping agents consumindo PKP |
| Fornecedores | 5-10 marcas brasileiras publicando /.well-known/pkp/ |
| Enrichment API | API pública por GTIN/SKU |
| Padronização | Propor PKP como spec em Linux Foundation / UCP working group |

---

## 8. O que PKP NÃO é

- **Não é sistema de pagamento.** PKP resolve "o que comprar". AP2 resolve "como pagar".
- **Não é ranking oficial.** PKP fornece dados estruturados e confiança explícita. O agent decide o ranking.
- **Não é fonte única da verdade.** Múltiplas fontes podem publicar dados do mesmo produto. Canonicidade e confidence resolvem conflitos, não exclusividade.
- **Não garante atualização automática.** Freshness depende do publisher atualizar seus dados. `updated_at` e `confidence.verified_at` indicam idade, não garantem frescor.
- **Não impõe comportamento ao agent.** PKP fornece dados e skills. O agent é responsável por como usa, ranqueia e apresenta. Agents mal-comportados podem ignorar confidence — PKP não pode impedir isso, apenas torna transparente quando acontece.

---

## 9. Por Que Agora

1. **AP2 acabou de ser lançado** (setembro 2025) — falta a camada de product knowledge
2. **llms.txt provou o modelo** — 844k+ sites publicando conteúdo para LLMs na raiz do domínio
3. **Agent Skills é padrão aceito** — SKILL.md provou que markdown + YAML funciona para agents
4. **Google está adicionando atributos AI ao Merchant Center** — o mercado reconhece que feeds são insuficientes
5. **Ninguém ocupou a camada de product knowledge** — UCP, ACP, AP2, MCP resolvem transação e orquestração
6. **O Brasil é lab perfeito** — PIX é ubíquo, e-commerce forte, mercado grande para validar

---

## 10. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Google expande Merchant Center | PKP é open e multi-plataforma. Se Google cobrir, PKP se torna exportador universal |
| Fornecedores não publicam | Agent-first — bootstrap com dados ai-generated. Fornecedores entram quando percebem valor |
| llms.txt evolui para cobrir produtos | PKP é complementar a llms.txt — um para conteúdo geral, outro para dados estruturados de produto |
| AP2 exige formato diferente | PKP é formato de discovery/decisão. AP2 é formato de pagamento. São camadas diferentes |
| Adoção lenta | Bootstrap com Bia + 100 produtos + demo público. Low cost, high signal |

---

## 11. Próximos Passos Imediatos

1. **Publicar spec v0.4** — GitHub repo com especificação, catalog.json, skill.md, 10 PRODUCT.md
2. **Construir CLI** — `npx pkp validate` + `npx pkp serve` (serve /.well-known/pkp/ localmente)
3. **Gerar 100 produtos PKP** — Via AI, hospedados em pkp.kodda.ai
4. **Publicar Agent Skill** — skill.md que qualquer agent pode consumir
5. **Integrar com Bia** — Bia consome PKP para recomendações
6. **Gravar demo** — Vídeo: agent + PKP + AP2 flow (discovery → decisão → compra)

---

## Apêndice A: Feed Tradicional vs PKP

### Feed de afiliado (Awin) hoje:

```csv
product_name,price,currency,deep_link,image_url,category,brand
"Galaxy S25 Ultra 256GB",9499.00,BRL,https://loja.com/...,https://img.com/...,celulares,Samsung
```

**7 campos. Zero contexto. Zero comparabilidade. Zero confiança.**

### PKP (PRODUCT.md no domínio do fornecedor):

- 40+ campos estruturados e comparáveis
- Confidence por bloco (source, level, verified_at)
- Contexto de uso por persona
- Objeções respondidas
- Alternativas e acessórios
- purchase_urls com AP2 enabled
- Progressive disclosure (L0/L1/L2)
- Descobrível via HTTP GET — sem SDK, sem integração

**A diferença entre "achei esse celular por R$9.499" e "esse é o melhor para você porque..." com transparência sobre a confiança dos dados.**

---

## Apêndice B: Arquitetura Completa

```
┌─────────────────────────────────────────────────────────────┐
│                    AI AGENT                                  │
│          (ChatGPT, Gemini, Bia, Perplexity, Claude)         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Agent Skill │  │   PKP Data   │  │    AP2       │     │
│  │  (skill.md)  │  │ (PRODUCT.md) │  │  (Mandates)  │     │
│  │  "como ler"  │  │  "o quê"     │  │  "como pagar"│     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │               │
│  ┌──────▼─────────────────▼─────────────────▼──────┐       │
│  │              CAMADAS DE ACESSO                   │       │
│  │                                                  │       │
│  │  Camada 1: HTTP GET /.well-known/pkp/           │       │
│  │  Camada 2: MCP Server (search, compare, filter) │       │
│  │  Camada 3: Registry (discovery cross-domínio)   │       │
│  └──────┬──────────────────┬───────────────────────┘       │
│         │                  │                                │
├─────────▼──────────────────▼────────────────────────────────┤
│              FORNECEDORES / MARCAS                          │
│                                                             │
│  samsung.com.br/.well-known/pkp/                           │
│  apple.com.br/.well-known/pkp/                             │
│  pkp.kodda.ai/.well-known/pkp/  (bootstrap ai-generated)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

*Kodda Serviços de Inteligência Artificial LTDA*
*CNPJ: 63.644.444/0001-80*
*Contato: pedro@kodda.ai*
