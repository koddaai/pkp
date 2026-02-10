import { z } from "zod";

/**
 * Smartwatch Display Specs
 */
export const SmartwatchDisplay = z.object({
  size_mm: z.number().min(30).max(60),
  resolution: z.string().optional(), // "396x484"
  technology: z.string(), // "AMOLED", "LTPO OLED"
  always_on: z.boolean().optional(),
  brightness_nits: z.number().optional(),
  protection: z.string().optional(), // "Sapphire Crystal"
});

/**
 * Smartwatch Health Sensors
 */
export const SmartwatchHealth = z.object({
  heart_rate: z.boolean(),
  blood_oxygen: z.boolean().optional(),
  ecg: z.boolean().optional(),
  temperature: z.boolean().optional(),
  sleep_tracking: z.boolean().optional(),
  stress_tracking: z.boolean().optional(),
  blood_pressure: z.boolean().optional(),
});

/**
 * Smartwatch Fitness Features
 */
export const SmartwatchFitness = z.object({
  gps: z.boolean(),
  workout_modes: z.number().optional(),
  water_resistance_atm: z.number().optional(), // 5 ATM = 50m
  swim_tracking: z.boolean().optional(),
  running_metrics: z.boolean().optional(),
  cycling_metrics: z.boolean().optional(),
});

/**
 * Smartwatch Battery Specs
 */
export const SmartwatchBattery = z.object({
  capacity_mah: z.number().optional(),
  days_typical: z.number().optional(),
  fast_charge: z.boolean().optional(),
  wireless_charge: z.boolean().optional(),
});

/**
 * Smartwatch Connectivity
 */
export const SmartwatchConnectivity = z.object({
  bluetooth: z.string(), // "5.3"
  wifi: z.boolean().optional(),
  nfc: z.boolean().optional(),
  lte: z.boolean().optional(),
  ultra_wideband: z.boolean().optional(),
});

/**
 * Smartwatch Physical Specs
 */
export const SmartwatchPhysical = z.object({
  case_size_mm: z.number(),
  case_material: z.string(), // "Aluminum", "Titanium", "Stainless Steel"
  weight_grams: z.number(),
  strap_material: z.string().optional(),
  strap_size: z.string().optional(), // "S/M", "M/L"
  colors: z.array(z.string()).optional(),
});

/**
 * Complete Smartwatch Specs Schema
 */
export const SmartwatchSpecs = z.object({
  display: SmartwatchDisplay,
  health: SmartwatchHealth,
  fitness: SmartwatchFitness,
  battery: SmartwatchBattery,
  connectivity: SmartwatchConnectivity,
  physical: SmartwatchPhysical,
  os: z.string(), // "watchOS 11", "Wear OS 5"
  storage_gb: z.number().optional(),
  voice_assistant: z.string().optional(), // "Siri", "Google Assistant"
  compatibility: z.array(z.string()).optional(), // ["iOS", "Android"]
});

export type SmartwatchSpecs = z.infer<typeof SmartwatchSpecs>;

/**
 * Category metadata for smartwatches
 */
export const SmartwatchCategoryMeta = {
  category: "smartwatches",
  aliases: ["smartwatch", "relogio-inteligente", "wearable"],
  min_completeness: 0.65,
  required_specs: [
    "display.size_mm",
    "display.technology",
    "health.heart_rate",
    "fitness.gps",
    "physical.case_size_mm",
    "physical.weight_grams",
    "os",
  ],
  comparison_axes: [
    {
      name: "Saude",
      fields: ["health.heart_rate", "health.ecg", "health.blood_oxygen"],
      description: "Monitoramento de saude",
    },
    {
      name: "Fitness",
      fields: ["fitness.gps", "fitness.workout_modes", "fitness.water_resistance_atm"],
      description: "Recursos para exercicios",
    },
    {
      name: "Bateria",
      fields: ["battery.days_typical"],
      description: "Duracao da bateria",
    },
    {
      name: "Design",
      fields: ["physical.case_material", "physical.weight_grams", "display.size_mm"],
      description: "Materiais e tamanho",
    },
  ],
} as const;
