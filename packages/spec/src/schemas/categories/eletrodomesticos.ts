import { z } from "zod";

/**
 * Dishwasher Capacity Specs
 */
export const DishwasherCapacity = z.object({
  services: z.number().min(4).max(16),
  dishes: z.number().optional(),
  liters_internal: z.number().optional(),
});

/**
 * Dishwasher Programs
 */
export const DishwasherPrograms = z.object({
  total: z.number().min(1).max(15),
  list: z.array(z.string()), // ["Intensivo", "Normal", "Eco"]
});

/**
 * Dishwasher Water Specs
 */
export const DishwasherWater = z.object({
  consumption_liters: z.number(),
  hot_water_connection: z.boolean().optional(),
});

/**
 * Dishwasher Energy Specs
 */
export const DishwasherEnergy = z.object({
  consumption_kwh_cycle: z.number().optional(),
  energy_rating: z.string(), // "A", "B", "C"
  voltage: z.string(), // "220V", "127V", "Bivolt"
});

/**
 * Dishwasher Drying Specs
 */
export const DishwasherDrying = z
  .object({
    type: z.string(), // "Condensacao", "Ar quente"
    fan_assisted: z.boolean().optional(),
  })
  .optional();

/**
 * Dishwasher Noise Specs
 */
export const DishwasherNoise = z
  .object({
    db: z.number().min(30).max(70),
  })
  .optional();

/**
 * Appliance Physical Specs (generic)
 */
export const AppliancePhysical = z.object({
  height_cm: z.number(),
  width_cm: z.number(),
  depth_cm: z.number(),
  weight_kg: z.number().optional(),
  color: z.string().optional(),
});

/**
 * Dishwasher Features
 */
export const DishwasherFeatures = z.object({
  delay_start: z.boolean().optional(),
  delay_hours: z.number().optional(),
  half_load: z.boolean().optional(),
  child_lock: z.boolean().optional(),
  sanitize: z.boolean().optional(),
  display: z.string().optional(), // "LED BlueTouch"
});

/**
 * Dishwasher Interior Specs
 */
export const DishwasherInterior = z
  .object({
    racks: z.number().optional(),
    adjustable_upper_rack: z.boolean().optional(),
    cutlery_basket: z.boolean().optional(),
    cup_shelves: z.boolean().optional(),
    material: z.string().optional(), // "Aco inoxidavel"
  })
  .optional();

/**
 * Complete Dishwasher Specs Schema
 */
export const DishwasherSpecs = z.object({
  capacity: DishwasherCapacity,
  programs: DishwasherPrograms,
  water: DishwasherWater,
  energy: DishwasherEnergy,
  drying: DishwasherDrying,
  noise: DishwasherNoise,
  physical: AppliancePhysical,
  features: DishwasherFeatures.optional(),
  interior: DishwasherInterior,
});

export type DishwasherSpecs = z.infer<typeof DishwasherSpecs>;

/**
 * Generic Appliance Specs (for other appliances)
 */
export const GenericApplianceSpecs = z.object({
  capacity: z.record(z.unknown()).optional(),
  power: z
    .object({
      watts: z.number().optional(),
      voltage: z.string().optional(),
    })
    .optional(),
  energy: z
    .object({
      rating: z.string().optional(),
      consumption_kwh: z.number().optional(),
    })
    .optional(),
  physical: AppliancePhysical.optional(),
  features: z.record(z.unknown()).optional(),
});

export type GenericApplianceSpecs = z.infer<typeof GenericApplianceSpecs>;

/**
 * Category metadata for eletrodomesticos
 */
export const EletrodomesticosCategoryMeta = {
  category: "eletrodomesticos",
  aliases: ["appliances", "linha-branca", "eletrodomestico"],
  min_completeness: 0.6,
  required_specs: ["physical.height_cm", "physical.width_cm", "physical.depth_cm"],
  // Subcategory-specific required specs
  subcategories: {
    "lava-loucas": {
      required_specs: [
        "capacity.services",
        "programs.total",
        "water.consumption_liters",
        "energy.energy_rating",
        "energy.voltage",
      ],
    },
    "lava-roupas": {
      required_specs: ["capacity.kg", "programs.total", "energy.energy_rating", "energy.voltage"],
    },
    geladeira: {
      required_specs: ["capacity.liters", "energy.energy_rating", "features.frost_free"],
    },
  },
  comparison_axes: [
    {
      name: "Capacidade",
      fields: ["capacity.services", "capacity.kg", "capacity.liters"],
      description: "Tamanho e capacidade util",
    },
    {
      name: "Eficiencia",
      fields: ["energy.energy_rating", "water.consumption_liters"],
      description: "Consumo de energia e agua",
    },
    {
      name: "Programas",
      fields: ["programs.total", "programs.list"],
      description: "Versatilidade de uso",
    },
    {
      name: "Ruido",
      fields: ["noise.db"],
      description: "Nivel de barulho durante operacao",
    },
  ],
} as const;
