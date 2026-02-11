#!/usr/bin/env npx ts-node
/**
 * Import products from Awin affiliate feed to PKP format
 *
 * Usage:
 *   npx ts-node scripts/import-awin.ts --feed-id 89199 --output ./examples/kodda-catalog/products
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

// Load .env file if exists
function loadEnv() {
  const envPath = join(process.cwd(), '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    }
  }
}

loadEnv();

// Awin credentials from environment variables
const AWIN_API_KEY = process.env.AWIN_API_KEY;
const AWIN_PUBLISHER_ID = process.env.AWIN_PUBLISHER_ID;

if (!AWIN_API_KEY || !AWIN_PUBLISHER_ID) {
  console.error('Error: Missing Awin credentials.');
  console.error('Please set AWIN_API_KEY and AWIN_PUBLISHER_ID in your .env file or environment.');
  console.error('');
  console.error('Example .env file:');
  console.error('  AWIN_API_KEY=your-api-key-here');
  console.error('  AWIN_PUBLISHER_ID=your-publisher-id');
  process.exit(1);
}

// Category mapping from Awin categories to PKP categories
const CATEGORY_MAP: Record<string, { category: string; subcategory?: string }> = {
  'celular': { category: 'celulares/smartphones' },
  'smartphone': { category: 'celulares/smartphones' },
  'tablet': { category: 'tablets' },
  'tv': { category: 'tvs' },
  'televisor': { category: 'tvs' },
  'notebook': { category: 'notebooks' },
  'laptop': { category: 'notebooks' },
  'monitor': { category: 'monitors' },
  'fone': { category: 'audio', subcategory: 'headphones' },
  'headphone': { category: 'audio', subcategory: 'headphones' },
  'earbuds': { category: 'audio', subcategory: 'earbuds' },
  'soundbar': { category: 'audio', subcategory: 'soundbar' },
  'caixa de som': { category: 'audio', subcategory: 'speaker' },
  'smartwatch': { category: 'smartwatches' },
  'relogio': { category: 'smartwatches' },
  'geladeira': { category: 'eletrodomesticos', subcategory: 'refrigerador' },
  'refrigerador': { category: 'eletrodomesticos', subcategory: 'refrigerador' },
  'lavadora': { category: 'eletrodomesticos', subcategory: 'lavadora' },
  'lava e seca': { category: 'eletrodomesticos', subcategory: 'lava-e-seca' },
  'secadora': { category: 'eletrodomesticos', subcategory: 'secadora' },
  'ar condicionado': { category: 'eletrodomesticos', subcategory: 'ar-condicionado' },
  'micro-ondas': { category: 'eletrodomesticos', subcategory: 'micro-ondas' },
  'aspirador': { category: 'eletrodomesticos', subcategory: 'aspirador' },
  'purificador': { category: 'eletrodomesticos', subcategory: 'purificador' },
  'cooktop': { category: 'eletrodomesticos', subcategory: 'cooktop' },
  'forno': { category: 'eletrodomesticos', subcategory: 'forno' },
  'lava-loucas': { category: 'eletrodomesticos', subcategory: 'lava-loucas' },
  'camera': { category: 'cameras' },
  'projetor': { category: 'monitors', subcategory: 'projetor' },
  'ssd': { category: 'informatica', subcategory: 'armazenamento' },
  'memoria': { category: 'informatica', subcategory: 'memoria' },
  'carregador': { category: 'acessorios', subcategory: 'carregador' },
  'capa': { category: 'acessorios', subcategory: 'capa' },
  'pelicula': { category: 'acessorios', subcategory: 'pelicula' },
};

interface AwinProduct {
  aw_product_id: string;
  merchant_product_id: string;
  product_name: string;
  description: string;
  merchant_category: string;
  search_price: string;
  brand_name: string;
  product_GTIN?: string;
  merchant_deep_link: string;
  aw_deep_link: string;
  stock_status?: string;
  merchant_image_url?: string;
  promotional_text?: string;
  [key: string]: string | undefined;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function detectCategory(product: AwinProduct): { category: string; subcategory?: string } {
  const searchText = `${product.product_name} ${product.merchant_category} ${product.description}`.toLowerCase();

  for (const [keyword, mapping] of Object.entries(CATEGORY_MAP)) {
    if (searchText.includes(keyword.toLowerCase())) {
      return mapping;
    }
  }

  // Default fallback
  return { category: 'outros' };
}

function extractSpecs(product: AwinProduct): Record<string, unknown> {
  const specs: Record<string, unknown> = {};
  const desc = product.description || '';

  // Extract common specs from description
  const capacityMatch = desc.match(/(\d+)\s*(kg|litros|l)\b/i);
  if (capacityMatch) {
    specs.capacity = { value: parseInt(capacityMatch[1]), unit: capacityMatch[2].toLowerCase() };
  }

  const voltageMatch = desc.match(/(110|127|220|bivolt)\s*v?/i);
  if (voltageMatch) {
    specs.voltage = voltageMatch[1].toLowerCase() === 'bivolt' ? 'Bivolt' : `${voltageMatch[1]}V`;
  }

  const screenMatch = desc.match(/(\d+(?:\.\d+)?)\s*(?:polegadas|"|pol)/i);
  if (screenMatch) {
    specs.screen_size = parseFloat(screenMatch[1]);
  }

  const storageMatch = desc.match(/(\d+)\s*(gb|tb)\s*(ssd|hdd|memoria|armazenamento)?/i);
  if (storageMatch) {
    specs.storage = { value: parseInt(storageMatch[1]), unit: storageMatch[2].toUpperCase() };
  }

  const ramMatch = desc.match(/(\d+)\s*gb\s*(ram|memoria\s*ram)/i);
  if (ramMatch) {
    specs.ram_gb = parseInt(ramMatch[1]);
  }

  return specs;
}

function generateTags(product: AwinProduct): string[] {
  const tags: string[] = [];
  const text = `${product.product_name} ${product.description}`.toLowerCase();

  // Add brand
  if (product.brand_name) {
    tags.push(slugify(product.brand_name));
  }

  // Extract common tags
  const tagKeywords = [
    'wifi', 'bluetooth', 'smart', 'ai', 'inverter', '5g', '4k', '8k', 'oled', 'qled',
    'hdr', 'dolby', 'alexa', 'google', 'premium', 'pro', 'ultra', 'max', 'plus',
    'gaming', 'gamer', 'home office', 'portatil', 'sem fio', 'wireless'
  ];

  for (const keyword of tagKeywords) {
    if (text.includes(keyword)) {
      tags.push(keyword.replace(/\s+/g, '-'));
    }
  }

  return [...new Set(tags)].slice(0, 10);
}

function generateSummary(product: AwinProduct): string {
  let summary = product.description || product.product_name;

  // Clean up HTML and extra whitespace
  summary = summary
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate if too long
  if (summary.length > 500) {
    summary = summary.substring(0, 497) + '...';
  }

  return summary;
}

function convertToProductMd(product: AwinProduct, retailerName: string, retailerDomain: string, feedId: string): string {
  const sku = slugify(product.merchant_product_id || product.aw_product_id);
  const { category, subcategory } = detectCategory(product);
  const specs = extractSpecs(product);
  const tags = generateTags(product);
  const summary = generateSummary(product);
  const price = parseFloat(product.search_price) || 0;
  const now = new Date().toISOString();

  let md = `---
# === IDENTIDADE ===
schema: pkp/1.0
sku: "${sku}"
${product.product_GTIN ? `gtin: "${product.product_GTIN}"` : '# gtin: null'}
brand: "${product.brand_name || 'Generic'}"
name: "${product.product_name.replace(/"/g, '\\"')}"
category: "${category}"
${subcategory ? `subcategory: "${subcategory}"` : ''}

# === IDENTIFICADORES ADICIONAIS ===
identifiers:
  mpn: "${product.merchant_product_id}"
  ${product.product_GTIN ? `ean: "${product.product_GTIN}"` : '# ean: null'}

# === URI CANONICO ===
uri: "pkp://${retailerDomain}/${sku}"
canonical:
  domain: "${retailerDomain}"
  url: "${product.merchant_deep_link}"

# === DESCOBERTA (L0) ===
summary: "${summary.replace(/"/g, '\\"').replace(/\n/g, ' ')}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]

# === PRECO ===
price:
  type: "street"
  currency: "BRL"
  value: ${price}
  source: "retailer"
  updated_at: "${now}"
availability: "${product.stock_status === 'out of stock' ? 'out-of-stock' : 'in-stock'}"

# === ONDE COMPRAR ===
purchase_urls:
  - retailer: "${retailerName}"
    url: "${product.aw_deep_link}"
    ap2_enabled: false

# === CONFIANCA DOS DADOS ===
confidence:
  specs:
    level: "medium"
    source: "retailer-feed"
    verified_at: "${now}"
  price:
    level: "medium"
    source: "retailer-feed"
    verified_at: "${now}"

# === SPECS COMPARAVEIS (L1) ===
specs:
${Object.entries(specs).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join('\n') || '  # No specs extracted'}

# === FONTE DOS DADOS ===
# Importado do feed Awin ${retailerName} (feed_id: ${feedId})
# Data de importacao: ${now.split('T')[0]}
# aw_product_id: ${product.aw_product_id}
---

## Descricao

${product.description?.replace(/<[^>]*>/g, '').trim() || product.product_name}
`;

  return md;
}

async function fetchAwinFeed(feedId: string): Promise<AwinProduct[]> {
  // Awin feed URL format
  const feedUrl = `https://productdata.awin.com/datafeed/download/apikey/${AWIN_API_KEY}/language/any/fid/${feedId}/columns/aw_product_id,merchant_product_id,product_name,description,merchant_category,search_price,brand_name,product_GTIN,merchant_deep_link,aw_deep_link,stock_status,merchant_image_url,promotional_text/format/csv/delimiter/%2C/compression/gzip/`;

  console.log(`Fetching feed from: ${feedUrl.substring(0, 100)}...`);

  const response = await fetch(feedUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
  }

  // Decompress gzip
  const buffer = await response.arrayBuffer();
  const { gunzipSync } = await import('zlib');
  const csvData = gunzipSync(Buffer.from(buffer)).toString('utf-8');

  console.log(`Downloaded ${(csvData.length / 1024).toFixed(0)} KB of data`);

  // Parse CSV
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    relaxColumnCount: true,
  });

  console.log(`Parsed ${records.length} products`);

  return records;
}

// Retailer configurations (Feed ID -> retailer info)
const RETAILER_CONFIG: Record<string, { name: string; domain: string }> = {
  // Already imported
  '89199': { name: 'Samsung Shop BR', domain: 'shop.samsung.com' },
  '46967': { name: 'Kabum', domain: 'kabum.com.br' },
  // To import
  '47015': { name: 'Electrolux BR', domain: 'loja.electrolux.com.br' },
  '48117': { name: 'Cobasi', domain: 'cobasi.com.br' },
  '72033': { name: 'Stanley BR', domain: 'stanley1913.com.br' },
  '85451': { name: 'Mizuno BR', domain: 'mizuno.com.br' },
  '103134': { name: 'LG BR', domain: 'lg.com' },
  '91869': { name: 'Centauro', domain: 'centauro.com.br' },
  '95015': { name: 'Adidas BR', domain: 'adidas.com.br' },
  '97009': { name: 'Panasonic BR', domain: 'panasonic.com' },
  '113048': { name: 'Consul BR', domain: 'consul.com.br' },
};

async function main() {
  const args = process.argv.slice(2);
  let feedId = '89199'; // Default: Samsung BR
  let outputDir = './examples/kodda-catalog/products';
  let limit = 0; // 0 = no limit
  let skipExisting = true;
  let retailerName = '';
  let retailerDomain = '';

  // Parse args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--feed-id' && args[i + 1]) {
      feedId = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[++i];
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[++i]);
    } else if (args[i] === '--overwrite') {
      skipExisting = false;
    } else if (args[i] === '--retailer' && args[i + 1]) {
      retailerName = args[++i];
    } else if (args[i] === '--domain' && args[i + 1]) {
      retailerDomain = args[++i];
    }
  }

  // Use config or args for retailer info
  const config = RETAILER_CONFIG[feedId];
  if (!retailerName) retailerName = config?.name || 'Unknown Retailer';
  if (!retailerDomain) retailerDomain = config?.domain || 'unknown.com';

  console.log(`\nAwin Feed Import`);
  console.log(`================`);
  console.log(`Retailer: ${retailerName}`);
  console.log(`Domain: ${retailerDomain}`);
  console.log(`Feed ID: ${feedId}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Limit: ${limit || 'none'}`);
  console.log(`Skip existing: ${skipExisting}\n`);

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Fetch feed
  const products = await fetchAwinFeed(feedId);

  // Process products
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  const toProcess = limit > 0 ? products.slice(0, limit) : products;

  for (const product of toProcess) {
    try {
      const sku = slugify(product.merchant_product_id || product.aw_product_id);
      const filename = `${sku}.md`;
      const filepath = join(outputDir, filename);

      if (skipExisting && existsSync(filepath)) {
        skipped++;
        continue;
      }

      const md = convertToProductMd(product, retailerName, retailerDomain, feedId);
      writeFileSync(filepath, md, 'utf-8');
      imported++;

      if (imported % 50 === 0) {
        console.log(`Progress: ${imported}/${toProcess.length} imported...`);
      }
    } catch (error) {
      console.error(`Error processing ${product.aw_product_id}: ${error}`);
      errors++;
    }
  }

  console.log(`\nImport Complete`);
  console.log(`===============`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total: ${toProcess.length}`);
}

main().catch(console.error);
