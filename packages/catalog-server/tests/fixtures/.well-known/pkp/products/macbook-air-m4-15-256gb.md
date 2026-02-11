---
# === IDENTIDADE ===
schema: pkp/1.0
sku: "macbook-air-m4-15-256gb"
gtin: "0195949850123"
brand: "Apple"
name: "MacBook Air M4 15 polegadas 256GB"
category: "notebooks"
subcategory: "notebooks-premium"

# === IDENTIFICADORES ADICIONAIS ===
identifiers:
  mpn: "MWXF3BZ/A"
  ean: "0195949850123"

# === VARIANTES ===
family_id: "macbook-air-m4-15"
variant_of: null
variant_attributes: ["storage", "memoria", "cor"]

# === URI CANONICO ===
uri: "pkp://pkp.kodda.ai/macbook-air-m4-15-256gb"
canonical:
  domain: "pkp.kodda.ai"
  url: "/.well-known/pkp/products/macbook-air-m4-15.md"

# === DESCOBERTA (L0) ===
summary: "Notebook ultrafino da Apple com chip M4, tela Liquid Retina de 15.3 polegadas, ate 18 horas de bateria e design sem ventoinha. Ideal para produtividade, edicao leve e consumo de midia. Silencioso e extremamente portatil."
tags: ["notebook", "apple", "macbook", "m4", "ultrafino", "silencioso", "retina", "macos"]
target_audience: ["profissionais-mobile", "estudantes", "criativos", "usuarios-apple"]
use_cases: ["produtividade", "desenvolvimento-web", "edicao-fotos", "streaming", "estudo"]

# === PRECO ===
price:
  type: "msrp"
  currency: "BRL"
  value: 15499.00
  source: "manufacturer"
  updated_at: "2026-02-09T12:00:00Z"
availability: "in-stock"
launch_date: "2025-03-08"

# === ONDE COMPRAR ===
purchase_urls:
  - retailer: "Apple Store"
    url: "https://apple.com.br/shop/buy-mac/macbook-air"
    ap2_enabled: false
  - retailer: "Magazine Luiza"
    url: "https://magazineluiza.com.br/macbook-air-m4-15"
    ap2_enabled: false
  - retailer: "Amazon BR"
    url: "https://amazon.com.br/dp/B0EXAMPLE4"
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
  display:
    size_inches: 15.3
    technology: "Liquid Retina IPS"
    resolution: "2880x1864"
    refresh_rate_hz: 60
    brightness_nits: 500
    color_gamut: "P3"
    true_tone: true
  processor:
    name: "Apple M4"
    cpu_cores: 10
    gpu_cores: 10
    neural_engine_cores: 16
    manufacturing_nm: 3
  memory:
    ram_gb: 16
    type: "Unified Memory"
    expandable: false
  storage:
    ssd_gb: 256
    type: "SSD NVMe"
    expandable: false
  battery:
    capacity_wh: 66.5
    hours_video: 18
    hours_web: 15
    fast_charge: true
    magsafe: true
  connectivity:
    wifi: "Wi-Fi 6E"
    bluetooth: "5.3"
    ports: ["MagSafe 3", "Thunderbolt 4 x2", "Audio jack"]
    thunderbolt_ports: 2
  physical:
    weight_kg: 1.51
    thickness_mm: 11.5
    material: "Aluminio reciclado"
    colors: ["Midnight", "Starlight", "Space Gray", "Silver"]
  audio:
    speakers: "6 alto-falantes com Spatial Audio"
    microphones: "3 microfones com direcionalidade"
  camera:
    resolution: "1080p FaceTime HD"
    center_stage: true
  keyboard:
    type: "Magic Keyboard"
    backlit: true
    touch_id: true
  software:
    os: "macOS Sonoma"
    update_years: 7

# === RELACOES ===
relationships:
  replaces: ["macbook-air-m3-15"]
  alternatives:
    - sku: "dell-xps-15-2025"
      brand: "Dell"
      reason: "Windows, mais opcoes de configuracao, tela OLED disponivel"
    - sku: "macbook-pro-14-m4"
      brand: "Apple"
      reason: "Mais potencia, ProMotion 120Hz, mais portas, mas mais caro"
  accessories:
    - category: "cases"
      query: "case MacBook Air 15"
    - category: "hubs"
      query: "hub USB-C Thunderbolt"
    - category: "monitores"
      query: "monitor USB-C 4K"

# === NARRATIVA DO FORNECEDOR ===
highlights:
  - "Ate 18 horas de bateria - o dia inteiro sem carregar"
  - "Silencioso - design sem ventoinha"
  - "Chip M4 com Neural Engine de 16 nucleos"
  - "100% aluminio reciclado"
  - "Tela Liquid Retina com P3 e True Tone"

preferred_terms:
  - term: "Liquid Retina"
    avoid: ["tela retina", "display IPS"]
  - term: "MagSafe"
    avoid: ["carregador magnetico"]
  - term: "Unified Memory"
    avoid: ["RAM compartilhada"]

# === REVIEWS AGREGADOS ===
reviews:
  average_rating: 4.8
  total_reviews: 2156
  source: "multiple"
  highlights_positive: ["bateria incrivel", "silencioso", "tela linda", "leve e fino"]
  highlights_negative: ["apenas 2 portas USB-C", "256GB e pouco", "preco alto", "sem ProMotion"]
---

## Contexto de Uso

### Para quem e ideal
- **Profissionais mobile** que trabalham em cafes, coworkings e viagens
- **Estudantes** que precisam de notebook leve com bateria o dia todo
- **Usuarios do ecossistema Apple** que querem integracao com iPhone, iPad, Apple Watch
- **Quem valoriza silencio** - nao tem ventoinha, zero ruido

### Para quem NAO e ideal
- Gamers (macOS tem pouco suporte a jogos)
- Editores de video profissionais (MacBook Pro e mais adequado)
- Quem precisa de Windows para softwares especificos
- Quem precisa de muitas portas (so tem 2 USB-C + MagSafe)

### Objecoes comuns

**"256GB e muito pouco"**
Para a maioria dos usuarios que usam cloud (iCloud, Google Drive, Dropbox), e suficiente. Se voce trabalha com arquivos grandes localmente, considere a versao de 512GB ou 1TB.

**"So tem 2 portas USB-C"**
Sim, e uma limitacao. Um hub USB-C de qualidade resolve, mas adiciona custo e volume. Se precisa de mais portas nativas, considere o MacBook Pro.

**"R$15.499 e muito caro"**
Notebooks Windows equivalentes em build quality e bateria custam similar. A durabilidade de Macs (7+ anos de uso tipico) dilui o custo. Valor de revenda tambem e superior.

### FAQ

- **Roda software Windows?** Sim, via Parallels ou VMware Fusion. Performance e muito boa para a maioria dos apps.
- **Da pra jogar?** Jogos casuais sim. AAA e limitado - poucos jogos tem versao nativa macOS.
- **Qual a diferenca pro MacBook Pro 14?** Pro tem ProMotion 120Hz, mais portas, chip mais potente, mas custa R$8.000+ a mais.
- **256GB vs 512GB?** Se voce usa cloud, 256GB basta. Se trabalha com fotos/videos locais, va de 512GB.
- **16GB de RAM unificada e suficiente?** Sim para 90% dos usuarios. So considere mais se trabalha com edicao de video 4K+ ou muitas VMs.
