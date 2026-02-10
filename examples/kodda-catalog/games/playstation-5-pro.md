---
# === IDENTIDADE ===
schema: pkp/1.0
sku: "playstation-5-pro"
gtin: "0711719587859"
brand: "Sony"
name: "PlayStation 5 Pro"
category: "games"
subcategory: "consoles"

# === IDENTIFICADORES ADICIONAIS ===
identifiers:
  mpn: "CFI-7015"
  ean: "0711719587859"

# === VARIANTES ===
family_id: "playstation-5"
variant_of: null
variant_attributes: []

# === URI CANONICO ===
uri: "pkp://pkp.kodda.ai/playstation-5-pro"
canonical:
  domain: "pkp.kodda.ai"
  url: "/.well-known/pkp/products/playstation-5-pro.md"

# === DESCOBERTA (L0) ===
summary: "Console de videogame Sony PlayStation 5 Pro com GPU 67% mais potente, 2TB SSD, ray tracing avancado e upscaling PSSR. Roda jogos em 4K 60fps ou 8K. Versao mais poderosa do PlayStation 5, ideal para gamers que querem graficos maximos."
tags: ["console", "playstation", "ps5", "sony", "gaming", "4k", "ray-tracing", "pro"]
target_audience: ["gamers-hardcore", "entusiastas-graficos", "streamers", "early-adopters"]
use_cases: ["gaming-4k", "streaming", "midia-digital", "vr2"]

# === PRECO ===
price:
  type: "msrp"
  currency: "BRL"
  value: 5499.00
  source: "manufacturer"
  updated_at: "2026-02-09T12:00:00Z"
availability: "in-stock"
launch_date: "2024-11-07"

# === ONDE COMPRAR ===
purchase_urls:
  - retailer: "PlayStation Store"
    url: "https://store.playstation.com/pt-br/product/ps5-pro"
    ap2_enabled: false
  - retailer: "Magazine Luiza"
    url: "https://magazineluiza.com.br/playstation-5-pro"
    ap2_enabled: false
  - retailer: "Amazon BR"
    url: "https://amazon.com.br/dp/B0EXAMPLE10"
    ap2_enabled: false

# === CONFIANCA DOS DADOS ===
confidence:
  specs:
    level: "high"
    source: "ai-generated"
    verified_at: "2026-02-09T12:00:00Z"
  price:
    level: "medium"
    source: "ai-generated"
    verified_at: "2026-02-09T12:00:00Z"
  alternatives:
    level: "low"
    source: "ai-generated"
    verified_at: "2026-02-09T12:00:00Z"

# === SPECS COMPARAVEIS (L1) ===
specs:
  processor:
    cpu: "AMD Zen 2 8-core"
    cpu_frequency_ghz: 3.85
    gpu: "AMD RDNA 3 custom"
    gpu_tflops: 16.7
    gpu_improvement: "67% vs PS5"
  memory:
    ram_gb: 16
    type: "GDDR6"
    bandwidth_gbs: 576
  storage:
    ssd_gb: 2000
    type: "Custom NVMe SSD"
    speed_gbs: 5.5
    expandable: true
  video:
    max_resolution: "8K"
    target_resolution: "4K"
    hdr: true
    ray_tracing: "Advanced"
    upscaling: "PSSR AI"
    frame_rate: ["60fps", "120fps"]
    vrr: true
  audio:
    technology: "Tempest 3D AudioTech"
    formats: ["Dolby Atmos", "DTS:X"]
  connectivity:
    hdmi: "HDMI 2.1"
    usb: ["USB-A 10Gbps x2", "USB-C 10Gbps x2"]
    wifi: "Wi-Fi 7"
    bluetooth: "5.1"
    ethernet: "Gigabit"
  physical:
    height_mm: 388
    width_mm: 89
    depth_mm: 216
    weight_kg: 3.1
    color: "Branco e Preto"
    disc_drive: false
  power:
    consumption_watts: 390
  features:
    backwards_compatible: true
    ps_vr2_compatible: true
    game_boost: true

# === RELACOES ===
relationships:
  replaces: []
  alternatives:
    - sku: "xbox-series-x"
      brand: "Microsoft"
      reason: "Ecossistema Xbox/Game Pass, retrocompatibilidade ampla"
    - sku: "playstation-5-slim"
      brand: "Sony"
      reason: "Mais barato, mesmo catalogo de jogos, suficiente para 1080p/1440p"
  accessories:
    - category: "controles"
      query: "DualSense PS5"
    - category: "headset"
      query: "Pulse 3D PS5"
    - category: "vr"
      query: "PlayStation VR2"
    - category: "ssd"
      query: "SSD NVMe PS5 heatsink"

# === NARRATIVA DO FORNECEDOR ===
highlights:
  - "GPU 67% mais potente que PS5 padrao"
  - "PSSR - upscaling por IA para 4K perfeito"
  - "2TB SSD - o dobro do armazenamento"
  - "Ray tracing avancado - reflexos e iluminacao realistas"
  - "Wi-Fi 7 - menor latencia para jogos online"

preferred_terms:
  - term: "PSSR"
    avoid: ["upscaling", "super resolucao"]
  - term: "Tempest 3D AudioTech"
    avoid: ["audio 3D", "som surround"]

# === REVIEWS AGREGADOS ===
reviews:
  average_rating: 4.5
  total_reviews: 2134
  source: "multiple"
  highlights_positive: ["graficos incriveis", "4K 60fps consistente", "2TB suficiente", "silencioso"]
  highlights_negative: ["muito caro", "sem leitor de disco", "upgrade incremental", "poucos jogos otimizados"]
---

## Contexto de Uso

### Para quem e ideal
- **Gamers que querem graficos maximos** - 4K 60fps ou 120fps em jogos otimizados
- **Donos de TV 4K 120Hz** que querem aproveitar ao maximo
- **Entusiastas de VR** que planejam usar PS VR2
- **Streamers** que precisam de desempenho consistente

### Para quem NAO e ideal
- Quem ja tem PS5 e esta satisfeito com 1080p/1440p
- Gamers casuais que jogam poucos titulos por ano
- Quem tem TV 1080p (PS5 padrao ja e suficiente)
- Orcamento limitado (PS5 Slim custa bem menos)

### Objecoes comuns

**"R$5.499 e muito caro para um console"**
E o console mais caro da geracao. Mas considerando 7+ anos de vida util, sai R$65/mes. Se graficos maximos sao prioridade, e o custo.

**"Vale o upgrade do PS5 normal?"**
So se voce tem TV 4K 120Hz e quer 60fps consistente em todos os jogos. Para a maioria, PS5 padrao ainda e excelente.

**"Por que nao tem leitor de disco?"**
Sony vende o leitor separado (opcional). A tendencia e digital, e isso reduz custo e tamanho do console.

**"Poucos jogos otimizados no lancamento"**
Verdade. Mas todos os jogos PS5 rodam melhor via Game Boost. E otimizacoes vem com o tempo.

### FAQ

- **Roda jogos de PS4?** Sim, retrocompatibilidade com 99% do catalogo PS4.
- **Preciso de TV 4K?** Nao obrigatoriamente, mas e onde o Pro brilha. Em TV 1080p, o PS5 padrao e suficiente.
- **Posso usar meus jogos digitais do PS5?** Sim, sua biblioteca digital e conta PSN funcionam normalmente.
- **O leitor de disco e vendido separado?** Sim, por aproximadamente R$350.
- **Quanto de SSD posso adicionar?** Ate 8TB em SSD NVMe adicional (slot M.2).
- **Funciona com PS VR2?** Sim, totalmente compativel.
