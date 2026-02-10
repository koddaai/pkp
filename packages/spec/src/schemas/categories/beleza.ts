import { z } from "zod";

/**
 * Product Size/Volume
 */
export const BeautySize = z.object({
  volume_ml: z.number().optional(),
  weight_grams: z.number().optional(),
  units: z.number().optional(), // for sets
});

/**
 * Skin/Hair Type compatibility
 */
export const BeautyCompatibility = z.object({
  skin_type: z.array(z.enum(["normal", "seca", "oleosa", "mista", "sensivel"])).optional(),
  hair_type: z.array(z.enum(["liso", "ondulado", "cacheado", "crespo", "todos"])).optional(),
  concerns: z.array(z.string()).optional(), // ["acne", "rugas", "manchas"]
});

/**
 * Certifications and claims
 */
export const BeautyCertifications = z.object({
  cruelty_free: z.boolean().optional(),
  vegan: z.boolean().optional(),
  organic: z.boolean().optional(),
  dermatologist_tested: z.boolean().optional(),
  hypoallergenic: z.boolean().optional(),
  anvisa: z.string().optional(), // registro ANVISA
});

/**
 * Skincare Product Specs
 */
export const SkincareSpecs = z.object({
  type: z.enum([
    "limpador",
    "tonico",
    "serum",
    "hidratante",
    "protetor-solar",
    "mascara",
    "esfoliante",
    "oleo",
    "creme-olhos",
    "tratamento",
  ]),
  size: BeautySize,
  compatibility: BeautyCompatibility,
  key_ingredients: z.array(z.string()).optional(), // ["retinol", "vitamina C"]
  spf: z.number().optional(),
  texture: z.string().optional(), // "gel", "creme", "loção"
  fragrance_free: z.boolean().optional(),
  certifications: BeautyCertifications.optional(),
  usage: z.enum(["dia", "noite", "ambos"]).optional(),
});

export type SkincareSpecs = z.infer<typeof SkincareSpecs>;

/**
 * Makeup Product Specs
 */
export const MakeupSpecs = z.object({
  type: z.enum([
    "base",
    "corretivo",
    "po",
    "blush",
    "bronzer",
    "iluminador",
    "batom",
    "gloss",
    "mascara-cilios",
    "delineador",
    "sombra",
    "sobrancelha",
    "primer",
  ]),
  size: BeautySize,
  shade: z.string().optional(), // cor/tom
  shade_range: z.number().optional(), // número de tons disponíveis
  finish: z.enum(["matte", "acetinado", "brilhante", "natural"]).optional(),
  coverage: z.enum(["leve", "media", "alta"]).optional(),
  waterproof: z.boolean().optional(),
  long_lasting_hours: z.number().optional(),
  spf: z.number().optional(),
  certifications: BeautyCertifications.optional(),
});

export type MakeupSpecs = z.infer<typeof MakeupSpecs>;

/**
 * Haircare Product Specs
 */
export const HaircareSpecs = z.object({
  type: z.enum([
    "shampoo",
    "condicionador",
    "mascara-capilar",
    "leave-in",
    "oleo-capilar",
    "finalizador",
    "tintura",
    "tratamento",
  ]),
  size: BeautySize,
  compatibility: BeautyCompatibility,
  key_ingredients: z.array(z.string()).optional(),
  sulfate_free: z.boolean().optional(),
  silicone_free: z.boolean().optional(),
  color_safe: z.boolean().optional(),
  treatment_goal: z.array(z.string()).optional(), // ["hidratação", "reparação"]
  certifications: BeautyCertifications.optional(),
});

export type HaircareSpecs = z.infer<typeof HaircareSpecs>;

/**
 * Perfume/Fragrance Specs
 */
export const FragranceSpecs = z.object({
  type: z.enum(["perfume", "eau-de-parfum", "eau-de-toilette", "colonia", "body-splash"]),
  size: BeautySize,
  gender: z.enum(["masculino", "feminino", "unissex"]),
  concentration: z.string().optional(), // "15-20%"
  fragrance_family: z.enum([
    "floral",
    "oriental",
    "amadeirado",
    "fresco",
    "citrico",
    "frutal",
    "gourmand",
  ]).optional(),
  top_notes: z.array(z.string()).optional(),
  heart_notes: z.array(z.string()).optional(),
  base_notes: z.array(z.string()).optional(),
  longevity_hours: z.number().optional(),
  sillage: z.enum(["intimo", "moderado", "forte", "monstro"]).optional(),
  season: z.array(z.enum(["primavera", "verao", "outono", "inverno"])).optional(),
});

export type FragranceSpecs = z.infer<typeof FragranceSpecs>;

/**
 * Category metadata for beauty
 */
export const BelezaCategoryMeta = {
  category: "beleza",
  aliases: ["beauty", "cosmeticos", "cosmetics", "skincare", "makeup", "perfumes"],
  min_completeness: 0.55,
  required_specs: ["type", "size"],
  subcategories: {
    skincare: {
      required_specs: ["type", "size"],
    },
    makeup: {
      required_specs: ["type", "size"],
    },
    haircare: {
      required_specs: ["type", "size"],
    },
    perfumes: {
      required_specs: ["type", "size", "gender"],
    },
  },
  comparison_axes: [
    {
      name: "Tipo",
      fields: ["type", "finish", "coverage"],
      description: "Tipo e características do produto",
    },
    {
      name: "Tamanho",
      fields: ["size.volume_ml", "size.weight_grams"],
      description: "Volume ou peso",
    },
    {
      name: "Compatibilidade",
      fields: ["compatibility.skin_type", "compatibility.hair_type"],
      description: "Tipo de pele ou cabelo",
    },
    {
      name: "Certificações",
      fields: ["certifications.cruelty_free", "certifications.vegan"],
      description: "Certificações e selos",
    },
  ],
} as const;
