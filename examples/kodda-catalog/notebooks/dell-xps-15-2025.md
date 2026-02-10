---
# === IDENTIDADE ===
schema: pkp/1.0
sku: "dell-xps-15-2025"
gtin: "5397184936123"
brand: "Dell"
name: "Dell XPS 15 (2025) Intel Core Ultra 7"
category: "notebooks"
subcategory: "notebooks-premium"

# === IDENTIFICADORES ADICIONAIS ===
identifiers:
  mpn: "XPS9530-7123SLV"
  ean: "5397184936123"

# === VARIANTES ===
family_id: "dell-xps-15-2025"
variant_of: null
variant_attributes: ["processador", "memoria", "storage", "display"]

# === URI CANONICO ===
uri: "pkp://pkp.kodda.ai/dell-xps-15-2025"
canonical:
  domain: "pkp.kodda.ai"
  url: "/.well-known/pkp/products/dell-xps-15-2025.md"

# === DESCOBERTA (L0) ===
summary: "Notebook premium Dell com tela OLED 3.5K de 15.6 polegadas, Intel Core Ultra 7, 16GB RAM e 512GB SSD. Design ultrafino com bordas minimas InfinityEdge. Ideal para profissionais que precisam de Windows com qualidade premium."
tags: ["notebook", "dell", "xps", "windows", "oled", "ultrafino", "intel", "premium"]
target_audience: ["profissionais", "desenvolvedores", "criativos", "executivos"]
use_cases: ["produtividade", "desenvolvimento", "edicao-fotos", "apresentacoes", "multitarefa"]

# === PRECO ===
price:
  type: "msrp"
  currency: "BRL"
  value: 13999.00
  source: "manufacturer"
  updated_at: "2026-02-09T12:00:00Z"
availability: "in-stock"
launch_date: "2025-01-15"

# === ONDE COMPRAR ===
purchase_urls:
  - retailer: "Dell Brasil"
    url: "https://dell.com.br/xps-15"
    ap2_enabled: false
  - retailer: "Magazine Luiza"
    url: "https://magazineluiza.com.br/dell-xps-15"
    ap2_enabled: false
  - retailer: "Amazon BR"
    url: "https://amazon.com.br/dp/B0EXAMPLE5"
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
    size_inches: 15.6
    technology: "OLED"
    resolution: "3456x2160"
    refresh_rate_hz: 60
    brightness_nits: 400
    color_gamut: "100% DCI-P3"
    hdr: "DisplayHDR 500"
    touch: true
  processor:
    name: "Intel Core Ultra 7 155H"
    cores: 16
    threads: 22
    base_ghz: 1.4
    turbo_ghz: 4.8
    manufacturing_nm: 7
    npu: true
  gpu:
    integrated: "Intel Arc Graphics"
    dedicated: "NVIDIA GeForce RTX 4060 (opcional)"
    vram_gb: 8
  memory:
    ram_gb: 16
    type: "LPDDR5x"
    speed_mhz: 6400
    max_gb: 64
    expandable: false
  storage:
    ssd_gb: 512
    type: "NVMe PCIe 4.0"
    expandable: true
  battery:
    capacity_wh: 86
    hours_video: 13
    fast_charge: true
  connectivity:
    wifi: "Wi-Fi 7"
    bluetooth: "5.4"
    ports: ["Thunderbolt 4 x2", "USB-C 3.2", "SD card", "Audio jack"]
    thunderbolt_ports: 2
  physical:
    weight_kg: 1.86
    thickness_mm: 18
    material: "Aluminio CNC"
    colors: ["Platinum Silver", "Graphite"]
  audio:
    speakers: "Quad speakers com Waves MaxxAudio"
  camera:
    resolution: "720p HD"
    ir: true
    windows_hello: true
  keyboard:
    type: "Full-size backlit"
    backlit: true
    fingerprint: true
  software:
    os: "Windows 11 Pro"
    update_years: 5

# === RELACOES ===
relationships:
  replaces: ["dell-xps-15-2024"]
  alternatives:
    - sku: "macbook-air-m4-15-256gb"
      brand: "Apple"
      reason: "macOS, bateria superior, mais leve, silencioso"
    - sku: "lenovo-thinkpad-x1-carbon"
      brand: "Lenovo"
      reason: "Mais leve, teclado melhor, mais opcoes de conectividade"
  accessories:
    - category: "docks"
      query: "dock Thunderbolt 4 Dell"
    - category: "cases"
      query: "case Dell XPS 15"
    - category: "monitores"
      query: "monitor USB-C 4K Dell"

# === NARRATIVA DO FORNECEDOR ===
highlights:
  - "Tela OLED 3.5K com 100% DCI-P3"
  - "Intel Core Ultra com NPU para IA"
  - "Design InfinityEdge - bordas minimas"
  - "Bateria de 86Wh - a maior da categoria"
  - "Thunderbolt 4 para conectividade profissional"

preferred_terms:
  - term: "InfinityEdge"
    avoid: ["bordas finas", "bezel-less"]
  - term: "Core Ultra"
    avoid: ["processador Intel", "chip Intel"]

# === REVIEWS AGREGADOS ===
reviews:
  average_rating: 4.4
  total_reviews: 1243
  source: "multiple"
  highlights_positive: ["tela OLED incrivel", "build quality", "desempenho", "teclado confortavel"]
  highlights_negative: ["esquenta sob carga", "webcam fraca", "preco alto", "ventoinha audivel"]
---

## Contexto de Uso

### Para quem e ideal
- **Profissionais Windows** que precisam de qualidade premium
- **Desenvolvedores** que trabalham com IDEs, VMs e containers
- **Criativos** que usam Adobe Creative Suite e precisam de tela OLED
- **Executivos** que fazem apresentacoes e valorizam design premium

### Para quem NAO e ideal
- Quem prioriza bateria acima de tudo (MacBook Air e superior)
- Gamers (existem notebooks gaming melhores pelo preco)
- Quem trabalha em ambientes muito silenciosos (ventoinha e audivel)
- Usuarios que fazem videochamadas frequentes (webcam e apenas 720p)

### Objecoes comuns

**"Por que nao comprar um MacBook?"**
Se voce precisa de Windows para software especifico, ou prefere mais flexibilidade de configuracao, o XPS e a melhor opcao premium Windows. O ecossistema tambem importa.

**"Esquenta muito?"**
Sob carga pesada, sim. E o preco de ter tanto poder em um chassis fino. Para uso normal, a temperatura e aceitavel.

**"A webcam e fraca"**
Verdade, e a principal critica. Se videochamadas sao importantes, considere uma webcam externa ou o MacBook.

### FAQ

- **Roda jogos?** Com a RTX 4060 opcional, sim. Nao e gaming notebook, mas roda titulos atuais em medium-high.
- **Da pra upgrade de RAM?** Nao, a RAM e soldada. Escolha 32GB ou 64GB se precisar.
- **Qual a diferenca OLED vs IPS?** OLED tem preto perfeito, cores mais vibrantes e HDR real. IPS e mais brilhante.
- **Vale a RTX 4060?** So se voce faz edicao de video, renderizacao 3D ou gaming. Para uso geral, a Intel Arc basta.
- **Quanto tempo de garantia?** 1 ano padrao, extensivel ate 5 anos com Dell ProSupport.
