import { NextRequest, NextResponse } from "next/server";

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

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "celulares/smartphones": [
    "smartphone", "celular", "iphone", "galaxy", "pixel", "motorola", "xiaomi",
    "telefone", "mobile", "5g", "android", "ios", "selfie"
  ],
  notebooks: [
    "notebook", "laptop", "macbook", "chromebook", "ultrabook", "thinkpad",
    "processador", "intel core", "amd ryzen", "ssd", "ram gb"
  ],
  tvs: [
    "tv", "televisor", "televisão", "smart tv", "oled", "qled", "led",
    "4k", "8k", "polegadas", "hdmi", "hdr"
  ],
  tablets: [
    "tablet", "ipad", "galaxy tab", "surface", "fire hd", "kindle"
  ],
  audio: [
    "fone", "headphone", "earbuds", "airpods", "caixa de som", "speaker",
    "bluetooth", "anc", "cancelamento de ruído", "jbl", "sony wh", "bose"
  ],
  monitors: [
    "monitor", "tela", "display", "gaming monitor", "ultrawide", "curvo",
    "144hz", "165hz", "240hz", "ips", "va", "freesync", "g-sync"
  ],
  smartwatches: [
    "smartwatch", "relógio inteligente", "apple watch", "galaxy watch",
    "fitbit", "garmin", "wear os", "watchos"
  ],
  cameras: [
    "câmera", "camera", "mirrorless", "dslr", "sony alpha", "canon eos",
    "nikon", "fujifilm", "lente", "megapixels"
  ],
  eletrodomesticos: [
    "geladeira", "refrigerador", "fogão", "microondas", "lava-louças",
    "máquina de lavar", "aspirador", "ar condicionado", "cafeteira", "airfryer"
  ],
  moda: [
    "tênis", "sapato", "roupa", "camiseta", "calça", "vestido", "jaqueta",
    "nike", "adidas", "puma", "moda", "fashion"
  ],
  games: [
    "playstation", "ps5", "ps4", "xbox", "nintendo", "switch", "console",
    "videogame", "controle", "gaming", "jogo", "game"
  ],
  moveis: [
    "sofá", "sofa", "poltrona", "cadeira", "mesa", "armário", "armario",
    "estante", "rack", "cama", "colchão", "móvel", "movel", "móveis",
    "decoração", "furniture", "madeira", "mdf"
  ],
  brinquedos: [
    "brinquedo", "toy", "lego", "boneca", "boneco", "pelúcia",
    "jogo de tabuleiro", "quebra-cabeça", "carrinho", "action figure",
    "playmobil", "hot wheels", "barbie", "educativo", "infantil"
  ],
  livros: [
    "livro", "book", "ebook", "audiobook", "kindle", "romance", "ficção",
    "autor", "editora", "páginas", "isbn", "literatura", "hq", "mangá"
  ],
  beleza: [
    "perfume", "maquiagem", "makeup", "skincare", "creme", "hidratante",
    "batom", "base", "rímel", "shampoo", "condicionador", "cosmético", "beleza"
  ],
};

function detectCategory(url: string, pageContent: string): { category: string; confidence: number } | null {
  const urlLower = url.toLowerCase();
  const contentLower = pageContent.toLowerCase().substring(0, 10000);
  const combined = urlLower + " " + contentLower;

  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;

    for (const keyword of keywords) {
      if (urlLower.includes(keyword)) {
        score += 10;
      }
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

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = Math.min(bestScore / Math.max(totalScore, 1), 1);

  return { category: bestCategory, confidence };
}

async function detectCategoryWithAI(apiKey: string, url: string, pageContent: string): Promise<string | null> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Analyze this product page and determine its category.

URL: ${url}

Page content (excerpt):
${pageContent.substring(0, 5000)}

Available categories: ${CATEGORIES.join(", ")}

Respond with ONLY the category name from the list above, nothing else.
If you cannot determine the category, respond with "unknown".`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const detected = data.content?.[0]?.text?.trim().toLowerCase();

  if (detected && CATEGORIES.includes(detected)) {
    return detected;
  }

  for (const cat of CATEGORIES) {
    if (detected?.includes(cat) || cat.includes(detected || "")) {
      return cat;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, category: providedCategory, brand } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Fetch the product page
    const pageContent = await fetchProductPage(url);
    if (!pageContent) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch product page" },
        { status: 400 }
      );
    }

    // Auto-detect category if not provided
    let category = providedCategory;
    let detectedCategory: string | undefined;

    if (!category) {
      const detected = detectCategory(url, pageContent);
      if (detected && detected.confidence > 0.3) {
        category = detected.category;
        detectedCategory = detected.category;
      } else {
        const aiCategory = await detectCategoryWithAI(apiKey, url, pageContent);
        if (aiCategory) {
          category = aiCategory;
          detectedCategory = aiCategory;
        } else {
          return NextResponse.json(
            { success: false, error: "Could not detect product category. Please select one." },
            { status: 400 }
          );
        }
      }
    }

    // Generate PRODUCT.md using Claude
    const productMd = await generateProductMd(apiKey, pageContent, url, category, brand);

    // Extract SKU and name from generated content
    const skuMatch = productMd.match(/^sku:\s*["']?([^"'\n]+)["']?/m);
    const nameMatch = productMd.match(/^name:\s*["']?([^"'\n]+)["']?/m);

    return NextResponse.json({
      success: true,
      sku: skuMatch?.[1] || "unknown",
      name: nameMatch?.[1] || "Unknown Product",
      category,
      detectedCategory,
      content: productMd,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

async function fetchProductPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    if (text.length > 30000) {
      text = text.substring(0, 30000);
    }

    return text;
  } catch {
    return null;
  }
}

async function generateProductMd(
  apiKey: string,
  pageContent: string,
  url: string,
  category: string,
  brand?: string
): Promise<string> {
  const systemPrompt = `You are a product data extraction specialist. Your task is to create a PRODUCT.md file following the PKP (Product Knowledge Protocol) specification.

Extract product information from the provided page content and generate a complete PRODUCT.md file.

The output MUST follow this exact format:
---
schema: pkp/1.0
sku: "unique-product-identifier"
brand: "Brand Name"
name: "Product Name"
category: "${category}"
summary: "Brief 1-2 sentence description for AI discovery"

price:
  type: msrp
  currency: BRL
  value: 1999.00

specs:
  # Category-specific specifications

confidence:
  specs:
    source: scraped
    verified_at: "${new Date().toISOString().split("T")[0]}"
---

## Highlights
- Key feature 1
- Key feature 2
- Key feature 3

## Specifications
Detailed specifications in prose form.

## FAQ
### Common question?
Answer based on product information.

IMPORTANT:
- Extract real data from the page, don't invent specifications
- Use appropriate units (GB, inches, mAh, etc.)
- Keep the summary concise and focused on AI discoverability
- Include 3-5 highlights that differentiate the product`;

  const userPrompt = `Generate a PRODUCT.md file for this product.

URL: ${url}
Category: ${category}
${brand ? `Brand: ${brand}` : ""}

Page content:
${pageContent}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error("No content in Claude response");
  }

  const mdMatch = content.match(/---[\s\S]*?---[\s\S]*/);
  return mdMatch ? mdMatch[0] : content;
}
