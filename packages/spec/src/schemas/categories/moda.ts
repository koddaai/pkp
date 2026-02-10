import { z } from "zod";

/**
 * Footwear Sizing Specs
 */
export const FootwearSizing = z.object({
  available_sizes: z.array(z.string()), // ["36", "37", "38", ...]
  fit: z.string().optional(), // "Regular", "Wide", "Narrow"
  size_recommendation: z.string().optional(), // "Fiel ao tamanho", "Meio numero maior"
});

/**
 * Footwear Upper Specs
 */
export const FootwearUpper = z.object({
  material: z.string(), // "Couro e mesh", "Primeknit"
  breathability: z.string().optional(), // "Alta", "Media", "Baixa"
  support: z.string().optional(), // "Cage lateral"
});

/**
 * Footwear Midsole Specs
 */
export const FootwearMidsole = z.object({
  technology: z.string(), // "Nike Air", "BOOST Light"
  air_unit: z.string().optional(), // "Calcanhar visivel"
  energy_return: z.number().optional(), // 0.87
  cushioning: z.string().optional(), // "Responsivo", "Maximo"
  drop_mm: z.number().optional(), // 10
});

/**
 * Footwear Outsole Specs
 */
export const FootwearOutsole = z.object({
  material: z.string(), // "Borracha Waffle", "Continental Rubber"
  durability: z.string().optional(), // "Alta", "Media"
  traction: z.string().optional(), // "Multi-superficie"
  wet_grip: z.string().optional(), // "Excelente"
});

/**
 * Footwear Weight Specs
 */
export const FootwearWeight = z.object({
  grams_per_shoe: z.number(),
  size_reference: z.string().optional(), // "42"
});

/**
 * Footwear Stability Specs
 */
export const FootwearStability = z
  .object({
    type: z.string().optional(), // "Neutro", "Estabilidade", "Motion Control"
    torsion_system: z.boolean().optional(),
  })
  .optional();

/**
 * Footwear Style Specs
 */
export const FootwearStyle = z.object({
  silhouette: z.string(), // "Low-top", "Mid-top", "High-top"
  closure: z.string(), // "Cadarco", "Velcro", "Slip-on"
  colors_available: z.array(z.string()).optional(),
});

/**
 * Footwear Sustainability
 */
export const FootwearSustainability = z
  .object({
    recycled_materials: z.boolean().optional(),
    vegan: z.boolean().optional(),
    primegreen: z.boolean().optional(),
    percentage_recycled: z.number().optional(),
  })
  .optional();

/**
 * Complete Footwear Specs Schema
 */
export const FootwearSpecs = z.object({
  sizing: FootwearSizing,
  upper: FootwearUpper,
  midsole: FootwearMidsole,
  outsole: FootwearOutsole,
  weight: FootwearWeight,
  stability: FootwearStability,
  style: FootwearStyle,
  sustainability: FootwearSustainability,
});

export type FootwearSpecs = z.infer<typeof FootwearSpecs>;

/**
 * Clothing Sizing Specs
 */
export const ClothingSizing = z.object({
  available_sizes: z.array(z.string()), // ["P", "M", "G", "GG"]
  fit: z.string().optional(), // "Regular", "Slim", "Oversized"
  size_guide: z.string().optional(), // URL or description
});

/**
 * Clothing Material Specs
 */
export const ClothingMaterial = z.object({
  composition: z.string(), // "100% Algodao", "60% Poliester, 40% Algodao"
  weight_gsm: z.number().optional(), // grams per square meter
  stretch: z.boolean().optional(),
});

/**
 * Clothing Care Specs
 */
export const ClothingCare = z
  .object({
    machine_wash: z.boolean().optional(),
    max_temperature: z.number().optional(), // Celsius
    dry_clean: z.boolean().optional(),
    tumble_dry: z.boolean().optional(),
  })
  .optional();

/**
 * Generic Clothing Specs
 */
export const ClothingSpecs = z.object({
  sizing: ClothingSizing,
  material: ClothingMaterial,
  care: ClothingCare,
  colors_available: z.array(z.string()).optional(),
  style: z.string().optional(), // "Casual", "Esportivo", "Formal"
});

export type ClothingSpecs = z.infer<typeof ClothingSpecs>;

/**
 * Category metadata for moda
 */
export const ModaCategoryMeta = {
  category: "moda",
  aliases: ["fashion", "vestuario", "calcados", "roupas"],
  min_completeness: 0.5,
  required_specs: ["sizing.available_sizes"],
  // Subcategory-specific
  subcategories: {
    "tenis-casual": {
      required_specs: [
        "sizing.available_sizes",
        "upper.material",
        "midsole.technology",
        "outsole.material",
        "weight.grams_per_shoe",
        "style.silhouette",
      ],
    },
    "tenis-corrida": {
      required_specs: [
        "sizing.available_sizes",
        "upper.material",
        "midsole.technology",
        "midsole.drop_mm",
        "outsole.material",
        "weight.grams_per_shoe",
      ],
    },
    camisetas: {
      required_specs: ["sizing.available_sizes", "material.composition"],
    },
    calcas: {
      required_specs: ["sizing.available_sizes", "material.composition"],
    },
  },
  comparison_axes: [
    {
      name: "Conforto",
      fields: ["midsole.cushioning", "upper.breathability", "weight.grams_per_shoe"],
      description: "Nivel de conforto para uso prolongado",
    },
    {
      name: "Durabilidade",
      fields: ["outsole.durability", "material.composition"],
      description: "Resistencia ao uso intenso",
    },
    {
      name: "Estilo",
      fields: ["style.silhouette", "colors_available"],
      description: "Design e opcoes visuais",
    },
    {
      name: "Sustentabilidade",
      fields: ["sustainability.recycled_materials", "sustainability.percentage_recycled"],
      description: "Impacto ambiental",
    },
  ],
} as const;
