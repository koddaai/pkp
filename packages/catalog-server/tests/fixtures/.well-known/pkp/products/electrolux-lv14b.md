---
# === IDENTIDADE ===
schema: pkp/1.0
sku: "electrolux-lv14b"
gtin: "7896584068123"
brand: "Electrolux"
name: "Lava-Loucas Electrolux LV14B 14 Servicos"
category: "eletrodomesticos"
subcategory: "lava-loucas"

# === IDENTIFICADORES ADICIONAIS ===
identifiers:
  mpn: "LV14B"
  ean: "7896584068123"

# === VARIANTES ===
family_id: "electrolux-lv14"
variant_of: null
variant_attributes: ["cor"]

# === URI CANONICO ===
uri: "pkp://pkp.kodda.ai/electrolux-lv14b"
canonical:
  domain: "pkp.kodda.ai"
  url: "/.well-known/pkp/products/electrolux-lava-loucas-lv14b.md"

# === DESCOBERTA (L0) ===
summary: "Lava-loucas Electrolux de 14 servicos com 6 programas de lavagem, tecnologia BlueTouch e classificacao A de eficiencia. Ideal para familias de 4-6 pessoas. Economia de agua e tempo comparado a lavagem manual."
tags: ["lava-loucas", "electrolux", "14-servicos", "eletrodomestico", "cozinha", "eficiencia-a"]
target_audience: ["familias", "casais", "apartamentos", "casas"]
use_cases: ["lavagem-diaria", "pos-jantar", "economia-agua", "higienizacao"]

# === PRECO ===
price:
  type: "street"
  currency: "BRL"
  value: 3299.00
  source: "retailer"
  updated_at: "2026-02-09T12:00:00Z"
availability: "in-stock"
launch_date: "2024-06-01"

# === ONDE COMPRAR ===
purchase_urls:
  - retailer: "Magazine Luiza"
    url: "https://magazineluiza.com.br/electrolux-lv14b"
    ap2_enabled: false
  - retailer: "Casas Bahia"
    url: "https://casasbahia.com.br/electrolux-lv14b"
    ap2_enabled: false
  - retailer: "Amazon BR"
    url: "https://amazon.com.br/dp/B0EXAMPLE7"
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
  capacity:
    services: 14
    dishes: 168
    liters_internal: 65
  programs:
    total: 6
    list: ["Intensivo", "Normal", "Eco", "Rapido 30min", "Cristais", "Pre-lavagem"]
  water:
    consumption_liters: 11.5
    hot_water_connection: false
  energy:
    consumption_kwh_cycle: 0.93
    energy_rating: "A"
    voltage: "220V"
  drying:
    type: "Condensacao"
    fan_assisted: true
  noise:
    db: 49
  physical:
    height_cm: 85
    width_cm: 60
    depth_cm: 60
    weight_kg: 52
    color: "Branco"
  features:
    delay_start: true
    delay_hours: 24
    half_load: true
    child_lock: true
    sanitize: true
    display: "LED BlueTouch"
  interior:
    racks: 3
    adjustable_upper_rack: true
    cutlery_basket: true
    cup_shelves: true
    material: "Aco inoxidavel"

# === RELACOES ===
relationships:
  replaces: ["electrolux-lv14a"]
  alternatives:
    - sku: "brastemp-blf14a"
      brand: "Brastemp"
      reason: "Design diferenciado, funcoes similares"
    - sku: "electrolux-le14x"
      brand: "Electrolux"
      reason: "Versao compacta 14 servicos, mais barata"
  accessories:
    - category: "detergente"
      query: "detergente lava-loucas tablete"
    - category: "secante"
      query: "secante lava-loucas"
    - category: "sal"
      query: "sal para lava-loucas"

# === NARRATIVA DO FORNECEDOR ===
highlights:
  - "6 programas incluindo Eco e Rapido 30min"
  - "BlueTouch - painel touch iluminado"
  - "Economia de 11.5L por ciclo vs 100L+ manual"
  - "3 racks flexiveis para todo tipo de louca"
  - "Classificacao A de eficiencia energetica"

preferred_terms:
  - term: "BlueTouch"
    avoid: ["painel azul", "touch blue"]
  - term: "14 servicos"
    avoid: ["14 lugares", "14 pessoas"]

# === REVIEWS AGREGADOS ===
reviews:
  average_rating: 4.3
  total_reviews: 1432
  source: "multiple"
  highlights_positive: ["lava bem", "silenciosa", "economica", "cabe bastante louca"]
  highlights_negative: ["secagem podia ser melhor", "plastico medio", "preco alto", "instalacao trabalhosa"]
---

## Contexto de Uso

### Para quem e ideal
- **Familias de 4-6 pessoas** que geram louca suficiente para ciclo diario
- **Casais que cozinham muito** e usam muitos utensilios
- **Quem valoriza economia de agua** - 11.5L vs 100L+ na mao
- **Apartamentos e casas** com ponto de agua e espaco na cozinha

### Para quem NAO e ideal
- Moradores solo ou casais com pouca louca (modelo de 6-8 servicos e melhor)
- Cozinhas muito pequenas (60x60cm de espaco necessario)
- Quem nao tem ponto de agua e esgoto proximo
- Orcamento muito limitado (lavar na mao e gratis em custo direto)

### Objecoes comuns

**"Lava-loucas gasta muita agua e energia"**
Mito. Uma lava-loucas moderna usa 11.5L por ciclo. Lavar manualmente a mesma quantidade usa 100L+. Energia e minima - R$0.50 por ciclo aproximadamente.

**"Nao lava direito panelas engorduradas"**
O programa Intensivo a 70C resolve a maioria dos casos. Panelas muito engorduradas podem precisar de uma pre-lavagem rapida.

**"A secagem deixa a desejar"**
Comum em modelos de condensacao. Dica: abra a porta ao final do ciclo para secar com ar ambiente, ou use secante.

### FAQ

- **Precisa de instalacao profissional?** Recomendado, mas nao obrigatorio. Precisa de ponto de agua, esgoto e tomada 220V.
- **Quanto gasta de energia?** Cerca de R$15-20/mes com uso diario.
- **Posso lavar panelas?** Sim, no rack inferior. Evite aluminio sem revestimento.
- **Qual detergente usar?** Detergente especifico para lava-loucas (tablete ou po). NUNCA use detergente comum.
- **O que e o sal?** Sal regenerador para o amaciador de agua. Necessario em regioes com agua dura.
