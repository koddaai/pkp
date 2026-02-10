import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import Anthropic from "@anthropic-ai/sdk";
import { fetch } from "undici";
import { validateProductMd, calculateCompleteness, parseProductMd } from "@pkprotocol/spec";
import { slugify } from "@pkprotocol/shared";

export interface GenerateOptions {
  url?: string;
  category?: string;
  output?: string;
  brand?: string;
  verbose?: boolean;
  file?: string;
  outputDir?: string;
  concurrency?: number;
}

interface BatchItem {
  url: string;
  category?: string;
  brand?: string;
}

interface BatchResult {
  url: string;
  success: boolean;
  outputPath?: string;
  sku?: string;
  name?: string;
  completeness?: number;
  valid?: boolean;
  error?: string;
}

/**
 * Available product categories
 */
const CATEGORIES = [
  "celulares/smartphones",
  "notebooks",
  "tvs",
  "eletrodomesticos",
  "moda",
  "games",
  "tablets",
  "audio",
  "monitors",
  "smartwatches",
  "cameras",
  "moveis",
  "brinquedos",
  "livros",
  "beleza",
];

/**
 * Category detection keywords
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "celulares/smartphones": [
    "smartphone", "celular", "iphone", "galaxy", "pixel", "motorola", "xiaomi",
    "redmi", "poco", "oneplus", "telefone", "mobile", "5g", "android", "ios",
    "selfie", "câmera traseira", "bateria mah"
  ],
  notebooks: [
    "notebook", "laptop", "macbook", "chromebook", "ultrabook", "thinkpad",
    "ideapad", "inspiron", "pavilion", "vivobook", "zenbook", "swift",
    "processador", "intel core", "amd ryzen", "ssd", "ram gb"
  ],
  tvs: [
    "tv", "televisor", "televisão", "smart tv", "oled", "qled", "led",
    "4k", "8k", "polegadas", "hdmi", "hdr", "dolby vision", "samsung tv",
    "lg tv", "sony tv", "tcl", "tela grande"
  ],
  tablets: [
    "tablet", "ipad", "galaxy tab", "surface", "fire hd", "kindle",
    "caneta stylus", "apple pencil", "s pen", "tela touch"
  ],
  audio: [
    "fone", "headphone", "earbuds", "airpods", "caixa de som", "speaker",
    "bluetooth", "wireless", "anc", "cancelamento de ruído", "jbl",
    "sony wh", "bose", "sennheiser", "audio", "som", "música"
  ],
  monitors: [
    "monitor", "tela", "display", "gaming monitor", "ultrawide", "curvo",
    "144hz", "165hz", "240hz", "ips", "va", "freesync", "g-sync",
    "4k monitor", "dell monitor", "lg monitor", "samsung monitor"
  ],
  smartwatches: [
    "smartwatch", "relógio inteligente", "apple watch", "galaxy watch",
    "fitbit", "garmin", "amazfit", "wear os", "watchos", "frequência cardíaca",
    "gps", "fitness", "saúde"
  ],
  cameras: [
    "câmera", "camera", "mirrorless", "dslr", "sony alpha", "canon eos",
    "nikon", "fujifilm", "lente", "megapixels", "sensor", "4k video",
    "fotografia", "objetiva"
  ],
  eletrodomesticos: [
    "geladeira", "refrigerador", "fogão", "cooktop", "microondas",
    "lava-louças", "lava louça", "máquina de lavar", "lavadora", "secadora",
    "aspirador", "ar condicionado", "ventilador", "purificador",
    "cafeteira", "liquidificador", "airfryer", "fritadeira", "eletrodoméstico"
  ],
  moda: [
    "tênis", "sapato", "bota", "sandália", "roupa", "camiseta", "calça",
    "vestido", "jaqueta", "casaco", "nike", "adidas", "puma", "new balance",
    "moda", "fashion", "tamanho", "cor", "masculino", "feminino"
  ],
  games: [
    "playstation", "ps5", "ps4", "xbox", "nintendo", "switch", "console",
    "videogame", "controle", "joystick", "gamepad", "gaming", "jogo",
    "game", "gamer"
  ],
  moveis: [
    "sofá", "sofa", "poltrona", "cadeira", "mesa", "armário", "armario",
    "estante", "rack", "cama", "colchão", "colchao", "guarda-roupa",
    "cômoda", "comoda", "criado-mudo", "móvel", "movel", "móveis", "moveis",
    "decoração", "decoracao", "furniture", "madeira", "mdf", "tok stok"
  ],
  brinquedos: [
    "brinquedo", "toy", "lego", "boneca", "boneco", "pelúcia", "pelucia",
    "jogo de tabuleiro", "board game", "quebra-cabeça", "puzzle", "carrinho",
    "controle remoto", "action figure", "playmobil", "hot wheels", "barbie",
    "nerf", "educativo", "infantil", "criança", "idade", "anos"
  ],
  livros: [
    "livro", "book", "ebook", "audiobook", "kindle", "romance", "ficção",
    "ficcao", "autor", "editora", "páginas", "paginas", "isbn", "best-seller",
    "literatura", "hq", "mangá", "manga", "graphic novel", "quadrinhos",
    "didático", "didatico", "educação", "educacao"
  ],
  beleza: [
    "perfume", "maquiagem", "makeup", "skincare", "creme", "hidratante",
    "protetor solar", "batom", "base", "rímel", "rimel", "sombra",
    "shampoo", "condicionador", "máscara capilar", "cabelo", "pele",
    "cosmético", "cosmetico", "beleza", "beauty", "natura", "boticário",
    "boticario", "avon", "mac", "nyx", "maybelline"
  ],
};

/**
 * Detect product category from URL and page content
 * @internal Exported for testing
 */
export function detectCategory(url: string, pageContent: string): { category: string; confidence: number } | null {
  const urlLower = url.toLowerCase();
  const contentLower = pageContent.toLowerCase().substring(0, 10000); // First 10k chars

  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;

    for (const keyword of keywords) {
      // Check URL (higher weight)
      if (urlLower.includes(keyword)) {
        score += 10;
      }

      // Check content
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      const matches = contentLower.match(regex);
      if (matches) {
        score += matches.length * 2;
      }
    }

    if (score > 0) {
      scores[category] = score;
    }
  }

  // Find category with highest score
  let bestCategory: string | null = null;
  let bestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  if (!bestCategory || bestScore < 5) {
    return null;
  }

  // Calculate confidence (0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = Math.min(bestScore / Math.max(totalScore, 1), 1);

  return { category: bestCategory, confidence };
}

/**
 * Detect category using AI (fallback)
 */
async function detectCategoryWithAI(
  client: Anthropic,
  url: string,
  pageContent: string
): Promise<string | null> {
  const categoriesList = CATEGORIES.join(", ");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Analyze this product page and determine its category.

URL: ${url}

Page content (excerpt):
${pageContent.substring(0, 5000)}

Available categories: ${categoriesList}

Respond with ONLY the category name from the list above, nothing else.
If you cannot determine the category, respond with "unknown".`,
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    return null;
  }

  const detected = textContent.text.trim().toLowerCase();

  // Validate it's a known category
  if (CATEGORIES.includes(detected)) {
    return detected;
  }

  // Try partial match
  for (const cat of CATEGORIES) {
    if (detected.includes(cat) || cat.includes(detected)) {
      return cat;
    }
  }

  return null;
}

/**
 * Fetch and extract text content from a URL
 */
async function fetchPageContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Simple HTML to text conversion
  // Remove scripts, styles, and HTML tags
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  // Limit content size for API
  if (text.length > 50000) {
    text = text.substring(0, 50000) + "...";
  }

  return text;
}

/**
 * Generate PRODUCT.md content using Claude
 */
async function generateWithClaude(
  pageContent: string,
  url: string,
  category: string,
  brand?: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is required.\n" +
        "Get your API key at https://console.anthropic.com/"
    );
  }

  const client = new Anthropic({ apiKey });

  const categoryInfo = getCategorySpecsInfo(category);

  const prompt = `You are a product data specialist. Analyze the following product page content and generate a PRODUCT.md file in PKP (Product Knowledge Protocol) format.

## Source URL
${url}

## Product Category
${category}

${brand ? `## Brand\n${brand}` : ""}

## Page Content
${pageContent}

## Required Output Format

Generate a complete PRODUCT.md file with YAML frontmatter and markdown content. Follow this exact structure:

\`\`\`markdown
---
schema: pkp/1.0
sku: "<generate-unique-sku>"
gtin: "<EAN/UPC if found, otherwise omit>"
brand: "<brand name>"
name: "<product name>"
category: "${category}"
subcategory: "<if applicable>"
summary: "<1-2 sentence summary for AI discovery, no more than 200 chars>"

identifiers:
  manufacturer_sku: "<if found>"
  ean: "<if found>"

canonical:
  manufacturer_url: "<official product page URL if found>"

price:
  type: msrp  # or "street" if not official price
  currency: BRL
  value: <price as number>
  source: "<manufacturer|retailer|scraped>"
  updated_at: "${new Date().toISOString().split("T")[0]}"

availability: "<in-stock|out-of-stock|pre-order|unknown>"

specs:
${categoryInfo}

purchase_urls:
  - retailer: "<store name>"
    url: "${url}"
    price: <price if available>

confidence:
  specs:
    source: ai-generated
    verified_at: "${new Date().toISOString().split("T")[0]}"

reviews:
  count: <number if found, otherwise 0>
  rating: <average rating if found, otherwise omit>
  source: "<source of reviews if found>"

highlights:
  - "<key feature 1>"
  - "<key feature 2>"
  - "<key feature 3>"

target_audience:
  - "<who should buy this>"

use_cases:
  - "<what it's good for>"

tags:
  - "<relevant tag 1>"
  - "<relevant tag 2>"
---

## Overview

<Brief product overview in 2-3 paragraphs>

## Key Features

- <Feature 1 with explanation>
- <Feature 2 with explanation>
- <Feature 3 with explanation>

## Specifications

<Detailed specifications in a readable format>

## What's in the Box

- <Item 1>
- <Item 2>

## FAQ

### <Common question 1>
<Answer>

### <Common question 2>
<Answer>

### <Common question 3>
<Answer>
\`\`\`

## Important Rules

1. Extract ALL available information from the page content
2. Use Brazilian Portuguese for the content when the source is in Portuguese
3. Generate a unique SKU based on brand and model
4. Be accurate - don't invent specifications that aren't in the source
5. For missing information, omit the field rather than guessing
6. Price should be a number without currency symbols
7. The summary must be concise (under 200 characters) and useful for AI product search
8. Include at least 3 FAQ items based on common questions about this product type
9. Mark confidence.specs.source as "ai-generated" since this is AI-extracted data

Generate the complete PRODUCT.md file now:`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Extract text from response
  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  let markdown = textContent.text;

  // Extract markdown from code block if present
  const codeBlockMatch = markdown.match(/```(?:markdown)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    markdown = codeBlockMatch[1]!;
  }

  return markdown.trim();
}

/**
 * Get category-specific specs info for the prompt
 */
function getCategorySpecsInfo(category: string): string {
  const specs: Record<string, string> = {
    "celulares/smartphones": `  # Smartphone specs
  display_size: <inches, e.g., 6.7>
  display_type: "<AMOLED|LCD|OLED>"
  display_resolution: "<e.g., 2796x1290>"
  refresh_rate_hz: <e.g., 120>
  processor: "<chip name>"
  ram_gb: <e.g., 8>
  storage_gb: <e.g., 256>
  storage_expandable: <true|false>
  main_camera_mp: <e.g., 200>
  front_camera_mp: <e.g., 12>
  battery_mah: <e.g., 5000>
  fast_charging_w: <e.g., 45>
  wireless_charging: <true|false>
  water_resistance: "<e.g., IP68>"
  os: "<e.g., Android 14>"
  5g: <true|false>
  dimensions_mm: "<e.g., 162.3 x 77.9 x 8.6>"
  weight_g: <e.g., 232>
  colors: ["<color1>", "<color2>"]`,

    notebooks: `  # Notebook specs
  screen_size: <inches, e.g., 15.6>
  screen_resolution: "<e.g., 2880x1800>"
  screen_type: "<IPS|OLED|LCD>"
  refresh_rate_hz: <e.g., 120>
  processor: "<full processor name>"
  processor_cores: <e.g., 8>
  ram_gb: <e.g., 16>
  ram_type: "<DDR4|DDR5|LPDDR5>"
  ram_expandable: <true|false>
  storage_gb: <e.g., 512>
  storage_type: "<NVMe SSD|SATA SSD|HDD>"
  gpu: "<GPU name or 'Integrated'>"
  gpu_vram_gb: <if dedicated GPU>
  battery_wh: <e.g., 72>
  weight_kg: <e.g., 1.8>
  os: "<e.g., Windows 11 Home>"
  ports: ["<port1>", "<port2>"]
  wifi: "<e.g., WiFi 6E>"
  bluetooth: "<e.g., 5.3>"
  webcam: "<e.g., 1080p>"
  keyboard_backlit: <true|false>
  fingerprint_reader: <true|false>`,

    tvs: `  # TV specs
  screen_size: <inches, e.g., 65>
  resolution: "<4K|8K|Full HD>"
  panel_type: "<OLED|QLED|LED|Mini-LED>"
  refresh_rate_hz: <e.g., 120>
  hdr: ["<HDR10|HDR10+|Dolby Vision>"]
  smart_tv: <true|false>
  os: "<e.g., Tizen|webOS|Google TV>"
  hdmi_ports: <e.g., 4>
  hdmi_version: "<e.g., 2.1>"
  speakers_watts: <e.g., 40>
  dimensions_cm: "<e.g., 145 x 83 x 5>"
  weight_kg: <e.g., 25>
  wall_mountable: <true|false>
  gaming_mode: <true|false>
  vrr: <true|false>`,

    eletrodomesticos: `  # Appliance specs
  capacity: "<e.g., 14 servicos, 10kg, 400L>"
  power_watts: <e.g., 1800>
  voltage: "<110V|220V|Bivolt>"
  energy_rating: "<A|B|C|D|E>"
  dimensions_cm: "<e.g., 60 x 85 x 60>"
  weight_kg: <e.g., 45>
  color: "<e.g., Inox>"
  programs: <number of programs>
  noise_db: <e.g., 45>
  warranty_months: <e.g., 12>`,

    moda: `  # Fashion specs
  material: "<main material>"
  composition: "<e.g., 95% algodao, 5% elastano>"
  sizes: ["<P>", "<M>", "<G>"]
  colors: ["<color1>", "<color2>"]
  gender: "<masculino|feminino|unissex>"
  style: "<e.g., casual, esportivo, formal>"
  care_instructions: "<washing instructions>"
  origin: "<country of origin>"`,

    games: `  # Games/Console specs
  platform: "<e.g., PlayStation 5, Xbox Series X, PC>"
  storage_gb: <e.g., 1000>
  resolution_max: "<e.g., 4K|8K>"
  fps_max: <e.g., 120>
  hdr: <true|false>
  ray_tracing: <true|false>
  backwards_compatible: <true|false>
  online_subscription: "<required service if any>"
  controllers_included: <e.g., 1>
  dimensions_cm: "<e.g., 39 x 10 x 26>"
  weight_kg: <e.g., 4.5>`,

    tablets: `  # Tablet specs
  display_size: <inches, e.g., 11>
  display_resolution: "<e.g., 2732x2048>"
  display_technology: "<LCD|OLED|Mini-LED>"
  refresh_rate_hz: <e.g., 120>
  processor: "<chip name>"
  ram_gb: <e.g., 8>
  storage_gb: <e.g., 256>
  battery_wh: <e.g., 40>
  weight_g: <e.g., 450>
  os: "<e.g., iPadOS 18, Android 14>"
  stylus_support: <true|false>
  keyboard_support: <true|false>
  cellular: <true|false>
  colors: ["<color1>", "<color2>"]`,

    audio: `  # Audio (Headphones/Speakers) specs
  type: "<over-ear|on-ear|in-ear|earbuds|portable|soundbar>"
  driver_size_mm: <e.g., 40>
  frequency_response: "<e.g., 20Hz-20kHz>"
  anc: <true|false>
  transparency_mode: <true|false>
  bluetooth_version: "<e.g., 5.3>"
  bluetooth_codecs: ["<AAC>", "<LDAC>", "<aptX>"]
  battery_hours: <e.g., 30>
  battery_hours_with_case: <e.g., 60>
  fast_charging: <true|false>
  wireless_charging: <true|false>
  multipoint: <true|false>
  weight_g: <e.g., 250>
  ip_rating: "<e.g., IPX4>"
  colors: ["<color1>", "<color2>"]`,

    monitors: `  # Monitor specs
  screen_size: <inches, e.g., 27>
  resolution: "<e.g., 3840x2160>"
  panel_type: "<IPS|VA|OLED|Mini-LED>"
  refresh_rate_hz: <e.g., 144>
  response_time_ms: <e.g., 1>
  brightness_nits: <e.g., 400>
  hdr: ["<HDR10>", "<HDR400>"]
  color_gamut_srgb: <e.g., 100>
  color_gamut_dci_p3: <e.g., 95>
  adaptive_sync: "<G-Sync|FreeSync|None>"
  hdmi_ports: <e.g., 2>
  displayport: <e.g., 1>
  usb_c: <e.g., 1>
  usb_c_power_delivery_w: <e.g., 90>
  height_adjustable: <true|false>
  pivot: <true|false>
  curved: <true|false>
  speakers: <true|false>`,

    smartwatches: `  # Smartwatch specs
  display_size_mm: <e.g., 45>
  display_technology: "<AMOLED|LTPO OLED>"
  always_on_display: <true|false>
  case_material: "<Aluminum|Titanium|Stainless Steel>"
  case_size_mm: <e.g., 45>
  weight_g: <e.g., 38>
  heart_rate: <true|false>
  blood_oxygen: <true|false>
  ecg: <true|false>
  gps: <true|false>
  water_resistance_atm: <e.g., 5>
  battery_days: <e.g., 2>
  os: "<e.g., watchOS 11, Wear OS 5>"
  lte: <true|false>
  nfc: <true|false>
  compatibility: ["<iOS>", "<Android>"]`,

    cameras: `  # Camera specs
  type: "<mirrorless|dslr|compact|action>"
  sensor_type: "<Full-Frame|APS-C|Micro Four Thirds>"
  megapixels: <e.g., 45>
  iso_range: "<e.g., 100-51200>"
  autofocus_points: <e.g., 759>
  eye_af: <true|false>
  video_max: "<e.g., 8K@30fps, 4K@120fps>"
  video_stabilization: "<IBIS|Digital|None>"
  viewfinder_type: "<EVF|OVF>"
  viewfinder_resolution: <e.g., 5760000>
  lcd_size: <e.g., 3.2>
  lcd_articulating: <true|false>
  continuous_fps: <e.g., 30>
  lens_mount: "<e.g., Sony E, Canon RF, Nikon Z>"
  weather_sealed: <true|false>
  dual_card_slots: <true|false>
  weight_g: <e.g., 650>`,
  };

  return specs[category] || `  # Generic specs\n  # Add category-specific specifications`;
}

/**
 * Parse batch file into items
 * Format: URL[,category[,brand]]
 * Lines starting with # are comments
 */
async function parseBatchFile(filePath: string, defaultCategory?: string): Promise<BatchItem[]> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const items: BatchItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith("#")) {
      continue;
    }

    const parts = line.split(",").map((p) => p.trim());
    const url = parts[0];
    const category = parts[1] || defaultCategory;
    const brand = parts[2];

    if (!url) {
      continue;
    }

    // Category is optional - will be auto-detected if not provided
    if (category && !CATEGORIES.includes(category)) {
      throw new Error(`Line ${i + 1}: Invalid category "${category}". Valid: ${CATEGORIES.join(", ")}`);
    }

    items.push({ url, category, brand });
  }

  return items;
}

/**
 * Process a single item in batch mode
 */
async function processBatchItem(
  item: BatchItem,
  outputDir: string
): Promise<BatchResult> {
  try {
    // Fetch page content
    const pageContent = await fetchPageContent(item.url);

    // Auto-detect category if not provided
    let category = item.category;
    if (!category) {
      const detected = detectCategory(item.url, pageContent);
      if (detected && detected.confidence > 0.3) {
        category = detected.category;
      } else {
        // Fall back to AI detection
        const client = new Anthropic();
        const aiCategory = await detectCategoryWithAI(client, item.url, pageContent);
        if (aiCategory) {
          category = aiCategory;
        } else {
          throw new Error("Could not auto-detect category. Please specify in batch file.");
        }
      }
    }

    // Generate with Claude
    const markdown = await generateWithClaude(pageContent, item.url, category, item.brand);

    // Validate
    const validation = validateProductMd(markdown);
    const parsed = parseProductMd(markdown);
    const completeness = calculateCompleteness(parsed.frontmatter);

    // Determine output path
    const sku = (parsed.frontmatter.sku as string) || `product-${Date.now()}`;
    const outputPath = join(outputDir, `${slugify(sku)}.md`);

    // Save
    await writeFile(outputPath, markdown, "utf-8");

    return {
      url: item.url,
      success: true,
      valid: validation.valid,
      outputPath,
      sku,
      name: parsed.frontmatter.name as string,
      completeness,
    };
  } catch (error) {
    return {
      url: item.url,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Run batch processing with concurrency limit
 */
async function runBatch(
  items: BatchItem[],
  outputDir: string,
  concurrency: number
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  const queue = [...items];
  let completed = 0;

  // Process in batches based on concurrency
  async function processNext(): Promise<void> {
    while (queue.length > 0) {
      const item = queue.shift()!;
      completed++;

      console.log(chalk.gray(`[${completed}/${items.length}] Processing: ${item.url}`));

      const result = await processBatchItem(item, outputDir);
      results.push(result);

      if (result.success) {
        console.log(chalk.green(`  ✓ ${result.sku} (${Math.round(result.completeness! * 100)}%)`));
      } else {
        console.log(chalk.red(`  ✗ ${result.error}`));
      }
    }
  }

  // Start concurrent workers
  const workers = Array(Math.min(concurrency, items.length))
    .fill(null)
    .map(() => processNext());

  await Promise.all(workers);

  return results;
}

/**
 * Print batch summary
 */
function printBatchSummary(results: BatchResult[]): void {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(chalk.blue("\n📊 Batch Generation Summary\n"));
  console.log(`  Total: ${results.length}`);
  console.log(`  ${chalk.green("Success:")} ${successful.length}`);
  console.log(`  ${chalk.red("Failed:")} ${failed.length}`);

  if (successful.length > 0) {
    const avgCompleteness =
      successful.reduce((sum, r) => sum + (r.completeness || 0), 0) / successful.length;
    console.log(`  Avg Completeness: ${Math.round(avgCompleteness * 100)}%`);

    console.log(chalk.green("\n✓ Generated files:"));
    successful.forEach((r) => {
      console.log(`  - ${r.outputPath} (${r.sku})`);
    });
  }

  if (failed.length > 0) {
    console.log(chalk.red("\n✗ Failed URLs:"));
    failed.forEach((r) => {
      console.log(`  - ${r.url}`);
      console.log(chalk.gray(`    ${r.error}`));
    });
  }
}

/**
 * Generate PRODUCT.md from URL using AI
 */
export async function generateCommand(options: GenerateOptions = {}): Promise<void> {
  const { url, category, output, brand, verbose = false, file, outputDir, concurrency = 3 } = options;

  console.log(chalk.blue("\n🤖 PKP Generate - AI-powered product data extraction\n"));

  // If no URL or file provided, show help
  if (!url && !file) {
    console.log(chalk.red("✗ URL is required (or use --file for batch mode)"));
    console.log(chalk.yellow("\n  Single URL mode:"));
    console.log("    pkp generate -u <url>");
    console.log("    pkp generate -u <url> -c <category>\n");
    console.log(chalk.yellow("  Batch mode:"));
    console.log("    pkp generate --file urls.txt\n");
    console.log("  Options:");
    console.log("    -u, --url <url>           Product page URL");
    console.log("    -c, --category <cat>      Product category (auto-detected if not provided)");
    console.log("    -b, --brand <brand>       Brand name (optional)");
    console.log("    -o, --output <file>       Output file path");
    console.log("    -f, --file <file>         Batch file with URLs");
    console.log("    -d, --output-dir <dir>    Output directory for batch (default: ./generated)");
    console.log("    -n, --concurrency <n>     Parallel requests (default: 3)");
    console.log("    -v, --verbose             Show detailed output");
    console.log("\n  Batch file format (one per line):");
    console.log("    URL,category,brand");
    console.log("    https://loja.com/produto,notebooks");
    console.log("    https://loja.com/celular,celulares/smartphones,Samsung");
    console.log("    https://loja.com/iphone   (category auto-detected)");
    console.log("\n  Available categories:");
    CATEGORIES.forEach((cat) => console.log(`    - ${cat}`));
    console.log("");
    process.exit(1);
  }

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(chalk.red("✗ ANTHROPIC_API_KEY environment variable is required"));
    console.log(chalk.yellow("\n  Set your API key:"));
    console.log("    export ANTHROPIC_API_KEY=sk-ant-...");
    console.log("\n  Get your API key at: https://console.anthropic.com/\n");
    process.exit(1);
  }

  // Batch mode
  if (file) {
    console.log(chalk.gray(`Reading batch file: ${file}\n`));

    try {
      const items = await parseBatchFile(file, category);

      if (items.length === 0) {
        console.log(chalk.yellow("No valid URLs found in batch file."));
        process.exit(1);
      }

      console.log(chalk.gray(`Found ${items.length} URLs to process (concurrency: ${concurrency})\n`));

      // Ensure output directory exists
      const outDir = outputDir || "./generated";
      await mkdir(outDir, { recursive: true });

      // Run batch
      const results = await runBatch(items, outDir, concurrency);

      // Print summary
      printBatchSummary(results);

      // Exit with error if any failed
      const failedCount = results.filter((r) => !r.success).length;
      if (failedCount > 0) {
        process.exit(1);
      }

      return;
    } catch (error) {
      console.log(chalk.red(`\n✗ Batch processing failed:`));
      console.log(chalk.red(`  ${error instanceof Error ? error.message : "Unknown error"}\n`));
      process.exit(1);
    }
  }

  // At this point url is guaranteed to be defined
  const productUrl = url!;
  let productCategory = category;

  // Validate category if provided
  if (productCategory && !CATEGORIES.includes(productCategory)) {
    console.log(chalk.red(`✗ Invalid category: ${productCategory}`));
    console.log(chalk.yellow("\n  Available categories:"));
    CATEGORIES.forEach((cat) => console.log(`    - ${cat}`));
    console.log("");
    process.exit(1);
  }

  try {
    // Step 1: Fetch page content
    console.log(chalk.gray("Fetching product page..."));
    const pageContent = await fetchPageContent(productUrl);

    if (verbose) {
      console.log(chalk.gray(`  Extracted ${pageContent.length} characters of text`));
    }

    // Step 1.5: Auto-detect category if not provided
    if (!productCategory) {
      console.log(chalk.gray("Detecting product category..."));

      // Try keyword-based detection first
      const detected = detectCategory(productUrl, pageContent);

      if (detected && detected.confidence > 0.3) {
        productCategory = detected.category;
        console.log(
          chalk.green(`  ✓ Detected category: ${chalk.cyan(productCategory)} `) +
          chalk.gray(`(confidence: ${Math.round(detected.confidence * 100)}%)`)
        );
      } else {
        // Fall back to AI detection
        console.log(chalk.gray("  Using AI to detect category..."));
        const client = new Anthropic();
        const aiCategory = await detectCategoryWithAI(client, productUrl, pageContent);

        if (aiCategory) {
          productCategory = aiCategory;
          console.log(chalk.green(`  ✓ AI detected category: ${chalk.cyan(productCategory)}`));
        } else {
          console.log(chalk.red("\n✗ Could not detect product category"));
          console.log(chalk.yellow("  Please specify a category with -c <category>\n"));
          console.log(chalk.yellow("  Available categories:"));
          CATEGORIES.forEach((cat) => console.log(`    - ${cat}`));
          console.log("");
          process.exit(1);
        }
      }
    }

    // Step 2: Generate with Claude
    console.log(chalk.gray("Generating PRODUCT.md with Claude..."));
    const markdown = await generateWithClaude(pageContent, productUrl, productCategory, brand);

    // Step 3: Validate the generated content
    console.log(chalk.gray("Validating generated content..."));
    const validation = validateProductMd(markdown);

    if (!validation.valid) {
      console.log(chalk.yellow("\n⚠️  Generated content has validation issues:"));
      validation.errors.forEach((err) => console.log(chalk.red(`  - ${err}`)));
      console.log(chalk.yellow("\n  The file will still be saved, but you may need to fix these issues.\n"));
    }

    // Calculate completeness
    const parsed = parseProductMd(markdown);
    const completeness = calculateCompleteness(parsed.frontmatter);

    // Step 4: Determine output path
    let outputPath = output;
    if (!outputPath) {
      const sku = (parsed.frontmatter.sku as string) || "product";
      outputPath = `${slugify(sku)}.md`;
    }

    // Step 5: Save the file
    await writeFile(outputPath, markdown, "utf-8");

    // Success output
    console.log(chalk.green("\n✓ PRODUCT.md generated successfully!\n"));
    console.log(`  File: ${chalk.cyan(outputPath)}`);
    console.log(`  SKU: ${chalk.cyan(parsed.frontmatter.sku || "unknown")}`);
    console.log(`  Name: ${chalk.cyan(parsed.frontmatter.name || "unknown")}`);
    console.log(`  Category: ${chalk.cyan(productCategory)}`);
    console.log(`  Completeness: ${chalk.cyan(Math.round(completeness * 100) + "%")}`);
    console.log(`  Validation: ${validation.valid ? chalk.green("✓ Valid") : chalk.yellow("⚠ Has issues")}`);

    console.log(chalk.blue("\n📝 Next steps:\n"));
    console.log(`  1. Review and edit ${chalk.cyan(outputPath)}`);
    console.log(`  2. Run ${chalk.cyan(`pkp validate ${outputPath}`)} to check for issues`);
    console.log(`  3. Add to your catalog with ${chalk.cyan("pkp build")}`);
    console.log("");

    if (verbose && markdown) {
      console.log(chalk.gray("Generated content preview:"));
      console.log(chalk.gray("─".repeat(60)));
      console.log(markdown.substring(0, 1000) + (markdown.length > 1000 ? "\n..." : ""));
      console.log(chalk.gray("─".repeat(60)));
    }
  } catch (error) {
    console.log(chalk.red("\n✗ Generation failed:"));
    console.log(chalk.red(`  ${error instanceof Error ? error.message : "Unknown error"}\n`));
    process.exit(1);
  }
}
