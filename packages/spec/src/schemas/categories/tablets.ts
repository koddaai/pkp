import { z } from "zod";

/**
 * Tablet Display Specs
 */
export const TabletDisplay = z.object({
  size_inches: z.number().min(7).max(15),
  technology: z.string(), // "LCD", "OLED", "Mini-LED"
  resolution: z.string(), // "2732x2048"
  refresh_rate_hz: z.number().min(60).max(240),
  brightness_nits: z.number().optional(),
  hdr: z.boolean().optional(),
  laminated: z.boolean().optional(),
  anti_reflective: z.boolean().optional(),
});

/**
 * Tablet Processor Specs
 */
export const TabletProcessor = z.object({
  name: z.string(), // "Apple M4", "Snapdragon 8 Gen 3"
  cores: z.number().min(4).max(16),
  gpu_cores: z.number().optional(),
});

/**
 * Tablet Camera Specs
 */
export const TabletCamera = z.object({
  rear_mp: z.number().optional(),
  front_mp: z.number(),
  video_max: z.string().optional(), // "4K@60fps"
  center_stage: z.boolean().optional(),
});

/**
 * Tablet Battery Specs
 */
export const TabletBattery = z.object({
  capacity_mah: z.number().optional(),
  capacity_wh: z.number().optional(),
  fast_charge_watts: z.number().optional(),
  hours_video: z.number().optional(),
});

/**
 * Tablet Storage Specs
 */
export const TabletStorage = z.object({
  internal_gb: z.number().min(32).max(2048),
  ram_gb: z.number().min(4).max(32),
  expandable: z.boolean().optional(),
});

/**
 * Tablet Connectivity Specs
 */
export const TabletConnectivity = z.object({
  wifi: z.string(), // "Wi-Fi 6E"
  bluetooth: z.string(), // "5.3"
  cellular: z.boolean().optional(),
  five_g: z.boolean().optional(),
  usb: z.string().optional(), // "USB-C 4"
  thunderbolt: z.boolean().optional(),
});

/**
 * Tablet Accessories Specs
 */
export const TabletAccessories = z.object({
  stylus_support: z.boolean(),
  stylus_included: z.boolean().optional(),
  keyboard_support: z.boolean().optional(),
  keyboard_included: z.boolean().optional(),
});

/**
 * Tablet Physical Specs
 */
export const TabletPhysical = z.object({
  weight_grams: z.number().min(200).max(1000),
  thickness_mm: z.number().optional(),
  materials: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
});

/**
 * Complete Tablet Specs Schema
 */
export const TabletSpecs = z.object({
  display: TabletDisplay,
  processor: TabletProcessor,
  camera: TabletCamera.optional(),
  battery: TabletBattery,
  storage: TabletStorage,
  connectivity: TabletConnectivity.optional(),
  accessories: TabletAccessories.optional(),
  physical: TabletPhysical,
  os: z.string(), // "iPadOS 18", "Android 14"
});

export type TabletSpecs = z.infer<typeof TabletSpecs>;

/**
 * Category metadata for tablets
 */
export const TabletCategoryMeta = {
  category: "tablets",
  aliases: ["tablet", "ipad"],
  min_completeness: 0.7,
  required_specs: [
    "display.size_inches",
    "display.resolution",
    "display.refresh_rate_hz",
    "processor.name",
    "storage.internal_gb",
    "storage.ram_gb",
    "physical.weight_grams",
    "os",
  ],
  comparison_axes: [
    {
      name: "Display",
      fields: ["display.size_inches", "display.technology", "display.refresh_rate_hz"],
      description: "Qualidade e tamanho da tela",
    },
    {
      name: "Performance",
      fields: ["processor.name", "storage.ram_gb"],
      description: "Poder de processamento",
    },
    {
      name: "Portabilidade",
      fields: ["physical.weight_grams", "physical.thickness_mm"],
      description: "Peso e espessura",
    },
    {
      name: "Produtividade",
      fields: ["accessories.stylus_support", "accessories.keyboard_support"],
      description: "Suporte a acessorios",
    },
  ],
} as const;
