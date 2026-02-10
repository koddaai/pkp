import { z } from "zod";

/**
 * Furniture Dimensions
 */
export const FurnitureDimensions = z.object({
  width_cm: z.number().optional(),
  height_cm: z.number().optional(),
  depth_cm: z.number().optional(),
  weight_kg: z.number().optional(),
});

/**
 * Furniture Materials
 */
export const FurnitureMaterial = z.object({
  primary: z.string(), // "madeira", "mdf", "metal", "vidro", "tecido"
  secondary: z.string().optional(),
  finish: z.string().optional(), // "laqueado", "natural", "fosco"
  upholstery: z.string().optional(), // "couro", "linho", "veludo"
});

/**
 * Sofa/Couch Specs
 */
export const SofaSpecs = z.object({
  type: z.enum(["sofa", "sofa-cama", "poltrona", "puff", "chaise"]),
  seats: z.number().optional(), // 2, 3, 4
  reclines: z.boolean().optional(),
  retractable: z.boolean().optional(),
  dimensions: FurnitureDimensions,
  material: FurnitureMaterial,
  colors: z.array(z.string()).optional(),
  assembly_required: z.boolean().optional(),
});

export type SofaSpecs = z.infer<typeof SofaSpecs>;

/**
 * Table Specs
 */
export const TableSpecs = z.object({
  type: z.enum(["jantar", "centro", "lateral", "escritorio", "console"]),
  shape: z.enum(["retangular", "redonda", "quadrada", "oval"]).optional(),
  extensible: z.boolean().optional(),
  seats: z.number().optional(),
  dimensions: FurnitureDimensions,
  material: FurnitureMaterial,
  colors: z.array(z.string()).optional(),
  assembly_required: z.boolean().optional(),
});

export type TableSpecs = z.infer<typeof TableSpecs>;

/**
 * Chair Specs
 */
export const ChairSpecs = z.object({
  type: z.enum(["jantar", "escritorio", "gamer", "banco", "banqueta"]),
  adjustable_height: z.boolean().optional(),
  armrests: z.boolean().optional(),
  wheels: z.boolean().optional(),
  max_weight_kg: z.number().optional(),
  ergonomic: z.boolean().optional(),
  dimensions: FurnitureDimensions,
  material: FurnitureMaterial,
  colors: z.array(z.string()).optional(),
  assembly_required: z.boolean().optional(),
});

export type ChairSpecs = z.infer<typeof ChairSpecs>;

/**
 * Storage Furniture Specs (armarios, estantes)
 */
export const StorageSpecs = z.object({
  type: z.enum(["armario", "estante", "rack", "comoda", "criado-mudo", "guarda-roupa"]),
  doors: z.number().optional(),
  drawers: z.number().optional(),
  shelves: z.number().optional(),
  mirror: z.boolean().optional(),
  dimensions: FurnitureDimensions,
  material: FurnitureMaterial,
  colors: z.array(z.string()).optional(),
  assembly_required: z.boolean().optional(),
});

export type StorageSpecs = z.infer<typeof StorageSpecs>;

/**
 * Bed Specs
 */
export const BedSpecs = z.object({
  type: z.enum(["solteiro", "casal", "queen", "king", "beliche"]),
  size: z.string().optional(), // "1.38x1.88m"
  headboard: z.boolean().optional(),
  storage: z.boolean().optional(), // bau
  box_included: z.boolean().optional(),
  dimensions: FurnitureDimensions,
  material: FurnitureMaterial,
  colors: z.array(z.string()).optional(),
  assembly_required: z.boolean().optional(),
});

export type BedSpecs = z.infer<typeof BedSpecs>;

/**
 * Category metadata for furniture
 */
export const MoveisCategoryMeta = {
  category: "moveis",
  aliases: ["furniture", "móveis", "decoracao", "decoração"],
  min_completeness: 0.55,
  required_specs: ["type", "dimensions"],
  subcategories: {
    sofas: {
      required_specs: ["type", "dimensions.width_cm"],
    },
    mesas: {
      required_specs: ["type", "shape"],
    },
    cadeiras: {
      required_specs: ["type"],
    },
    armarios: {
      required_specs: ["type", "dimensions"],
    },
    camas: {
      required_specs: ["type", "size"],
    },
  },
  comparison_axes: [
    {
      name: "Dimensões",
      fields: ["dimensions.width_cm", "dimensions.height_cm", "dimensions.depth_cm"],
      description: "Tamanho do móvel",
    },
    {
      name: "Material",
      fields: ["material.primary", "material.finish"],
      description: "Material e acabamento",
    },
    {
      name: "Conforto",
      fields: ["seats", "ergonomic", "adjustable_height"],
      description: "Conforto e ergonomia",
    },
  ],
} as const;
