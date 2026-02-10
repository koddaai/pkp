import { z } from "zod";

// Export all category schemas
export * from "./smartphones.js";
export * from "./notebooks.js";
export * from "./tvs.js";
export * from "./eletrodomesticos.js";
export * from "./moda.js";
export * from "./games.js";
export * from "./tablets.js";
export * from "./audio.js";
export * from "./monitors.js";
export * from "./smartwatches.js";
export * from "./cameras.js";
export * from "./moveis.js";
export * from "./brinquedos.js";
export * from "./livros.js";
export * from "./beleza.js";

// Import category metadata
import { SmartphoneCategoryMeta, SmartphoneSpecs } from "./smartphones.js";
import { NotebookCategoryMeta, NotebookSpecs } from "./notebooks.js";
import { TVCategoryMeta, TVSpecs } from "./tvs.js";
import { EletrodomesticosCategoryMeta, DishwasherSpecs } from "./eletrodomesticos.js";
import { ModaCategoryMeta, FootwearSpecs } from "./moda.js";
import { GamesCategoryMeta, ConsoleSpecs } from "./games.js";
import { TabletCategoryMeta, TabletSpecs } from "./tablets.js";
import { AudioCategoryMeta, HeadphoneSpecs, SpeakerSpecs } from "./audio.js";
import { MonitorCategoryMeta, MonitorSpecs } from "./monitors.js";
import { SmartwatchCategoryMeta, SmartwatchSpecs } from "./smartwatches.js";
import { CameraCategoryMeta, CameraSpecs } from "./cameras.js";
import { MoveisCategoryMeta, SofaSpecs, TableSpecs, ChairSpecs, StorageSpecs, BedSpecs } from "./moveis.js";
import { BrinquedosCategoryMeta, BuildingToySpecs, BoardGameSpecs, DollSpecs, VehicleToySpecs, EducationalToySpecs } from "./brinquedos.js";
import { LivrosCategoryMeta, FictionBookSpecs, NonFictionBookSpecs, TextbookSpecs, ChildrensBookSpecs, ComicSpecs } from "./livros.js";
import { BelezaCategoryMeta, SkincareSpecs, MakeupSpecs, HaircareSpecs, FragranceSpecs } from "./beleza.js";

/**
 * Category metadata type
 */
export interface CategoryMeta {
  category: string;
  aliases: readonly string[];
  min_completeness: number;
  required_specs: readonly string[];
  subcategories?: Record<
    string,
    {
      required_specs: readonly string[];
    }
  >;
  comparison_axes: readonly {
    name: string;
    fields: readonly string[];
    description: string;
  }[];
}

/**
 * All category metadata
 */
export const CATEGORY_METADATA: Record<string, CategoryMeta> = {
  "celulares/smartphones": SmartphoneCategoryMeta,
  smartphones: SmartphoneCategoryMeta,
  notebooks: NotebookCategoryMeta,
  tvs: TVCategoryMeta,
  eletrodomesticos: EletrodomesticosCategoryMeta,
  moda: ModaCategoryMeta,
  games: GamesCategoryMeta,
  tablets: TabletCategoryMeta,
  audio: AudioCategoryMeta,
  monitors: MonitorCategoryMeta,
  smartwatches: SmartwatchCategoryMeta,
  cameras: CameraCategoryMeta,
  moveis: MoveisCategoryMeta,
  brinquedos: BrinquedosCategoryMeta,
  livros: LivrosCategoryMeta,
  beleza: BelezaCategoryMeta,
};

/**
 * Category specs schemas
 */
export const CATEGORY_SPECS_SCHEMAS: Record<string, z.ZodTypeAny> = {
  "celulares/smartphones": SmartphoneSpecs,
  smartphones: SmartphoneSpecs,
  notebooks: NotebookSpecs,
  tvs: TVSpecs,
  "lava-loucas": DishwasherSpecs,
  "tenis-casual": FootwearSpecs,
  "tenis-corrida": FootwearSpecs,
  consoles: ConsoleSpecs,
  tablets: TabletSpecs,
  headphones: HeadphoneSpecs,
  earbuds: HeadphoneSpecs,
  speakers: SpeakerSpecs,
  monitors: MonitorSpecs,
  smartwatches: SmartwatchSpecs,
  cameras: CameraSpecs,
  // Furniture
  sofas: SofaSpecs,
  mesas: TableSpecs,
  cadeiras: ChairSpecs,
  armarios: StorageSpecs,
  camas: BedSpecs,
  // Toys
  lego: BuildingToySpecs,
  "jogos-tabuleiro": BoardGameSpecs,
  bonecas: DollSpecs,
  "controle-remoto": VehicleToySpecs,
  educativos: EducationalToySpecs,
  // Books
  ficcao: FictionBookSpecs,
  "nao-ficcao": NonFictionBookSpecs,
  didatico: TextbookSpecs,
  infantil: ChildrensBookSpecs,
  hq: ComicSpecs,
  manga: ComicSpecs,
  // Beauty
  skincare: SkincareSpecs,
  makeup: MakeupSpecs,
  haircare: HaircareSpecs,
  perfumes: FragranceSpecs,
};

/**
 * Get category metadata by category name or alias
 */
export function getCategoryMeta(category: string): CategoryMeta | undefined {
  // Direct match
  if (CATEGORY_METADATA[category]) {
    return CATEGORY_METADATA[category];
  }

  // Check aliases
  for (const meta of Object.values(CATEGORY_METADATA)) {
    if (meta.aliases.includes(category)) {
      return meta;
    }
  }

  // Check if it's a subcategory path
  const mainCategory = category.split("/")[0];
  if (mainCategory && CATEGORY_METADATA[mainCategory]) {
    return CATEGORY_METADATA[mainCategory];
  }

  return undefined;
}

/**
 * Get minimum completeness threshold for a category
 */
export function getCategoryMinCompleteness(category: string): number {
  const meta = getCategoryMeta(category);
  return meta?.min_completeness ?? 0.6; // Default 60%
}

/**
 * Get required specs for a category/subcategory
 */
export function getCategoryRequiredSpecs(category: string, subcategory?: string): string[] {
  const meta = getCategoryMeta(category);
  if (!meta) return [];

  const baseRequired = [...meta.required_specs];

  // Add subcategory-specific required specs
  if (subcategory && meta.subcategories?.[subcategory]) {
    baseRequired.push(...meta.subcategories[subcategory].required_specs);
  }

  return baseRequired;
}

/**
 * Get comparison axes for a category
 */
export function getCategoryComparisonAxes(
  category: string
): readonly { name: string; fields: readonly string[]; description: string }[] {
  const meta = getCategoryMeta(category);
  return meta?.comparison_axes ?? [];
}

/**
 * Get specs schema for a category/subcategory
 */
export function getCategorySpecsSchema(category: string, subcategory?: string): z.ZodTypeAny | undefined {
  // Try subcategory first
  if (subcategory && CATEGORY_SPECS_SCHEMAS[subcategory]) {
    return CATEGORY_SPECS_SCHEMAS[subcategory];
  }

  // Try main category
  if (CATEGORY_SPECS_SCHEMAS[category]) {
    return CATEGORY_SPECS_SCHEMAS[category];
  }

  // Try extracting main category from path
  const mainCategory = category.split("/")[0];
  if (mainCategory && CATEGORY_SPECS_SCHEMAS[mainCategory]) {
    return CATEGORY_SPECS_SCHEMAS[mainCategory];
  }

  return undefined;
}

/**
 * Validate specs against category schema
 */
export function validateCategorySpecs(
  category: string,
  subcategory: string | undefined,
  specs: unknown
): { valid: boolean; errors: string[] } {
  const schema = getCategorySpecsSchema(category, subcategory);

  if (!schema) {
    return { valid: true, errors: [] }; // No schema to validate against
  }

  const result = schema.safeParse(specs);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: result.error.errors.map((e) => `specs.${e.path.join(".")}: ${e.message}`),
  };
}

/**
 * List all supported categories
 */
export function listCategories(): string[] {
  return Object.keys(CATEGORY_METADATA);
}

/**
 * Check if a category is supported
 */
export function isCategorySupported(category: string): boolean {
  return getCategoryMeta(category) !== undefined;
}
