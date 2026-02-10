import { z } from "zod";

/**
 * Smartphone Display Specs
 */
export const SmartphoneDisplay = z.object({
  size_inches: z.number().min(4).max(8),
  technology: z.string(), // "AMOLED", "OLED", "LCD", "IPS"
  resolution: z.string(), // "2340x1080"
  refresh_rate_hz: z.number().min(60).max(240),
  brightness_nits: z.number().optional(),
  hdr: z.boolean().optional(),
  always_on: z.boolean().optional(),
  gorilla_glass: z.string().optional(),
  dynamic_island: z.boolean().optional(),
});

/**
 * Smartphone Processor Specs
 */
export const SmartphoneProcessor = z.object({
  name: z.string(), // "Snapdragon 8 Elite"
  cores: z.number().min(4).max(16),
  manufacturing_nm: z.number().optional(),
  neural_engine_cores: z.number().optional(),
});

/**
 * Smartphone Camera Specs
 */
export const SmartphoneCamera = z.object({
  main_mp: z.number().min(8).max(250),
  ultrawide_mp: z.number().optional(),
  telephoto_mp: z.number().optional(),
  zoom_optical: z.number().optional(),
  zoom_digital: z.number().optional(),
  video_max: z.string(), // "8K@30fps", "4K@60fps"
  ois: z.boolean().optional(),
  prores: z.boolean().optional(),
  spatial_video: z.boolean().optional(),
});

/**
 * Smartphone Battery Specs
 */
export const SmartphoneBattery = z.object({
  capacity_mah: z.number().min(2000).max(10000),
  fast_charge_watts: z.number().optional(),
  wireless_charge: z.boolean().optional(),
  wireless_charge_watts: z.number().optional(),
  magsafe: z.boolean().optional(),
  battery_share: z.boolean().optional(),
});

/**
 * Smartphone Storage Specs
 */
export const SmartphoneStorage = z.object({
  internal_gb: z.number().min(32).max(2048),
  ram_gb: z.number().min(4).max(24),
  expandable: z.boolean().optional(),
});

/**
 * Smartphone Connectivity Specs
 */
export const SmartphoneConnectivity = z.object({
  five_g: z.boolean(),
  wifi: z.string(), // "Wi-Fi 7", "Wi-Fi 6E"
  bluetooth: z.string(), // "5.3", "5.4"
  nfc: z.boolean().optional(),
  usb: z.string().optional(), // "USB-C 3.2"
  ultra_wideband: z.boolean().optional(),
});

/**
 * Smartphone Physical Specs
 */
export const SmartphonePhysical = z.object({
  weight_grams: z.number().min(100).max(350),
  thickness_mm: z.number().optional(),
  ip_rating: z.string().optional(), // "IP68"
  has_stylus: z.boolean().optional(),
  materials: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
});

/**
 * Smartphone Software Specs
 */
export const SmartphoneSoftware = z.object({
  os: z.string(), // "Android 15", "iOS 18"
  ui: z.string().optional(), // "One UI 7"
  update_years: z.number().min(1).max(10),
});

/**
 * Smartphone AI Features
 */
export const SmartphoneAI = z
  .object({
    features: z.array(z.string()),
  })
  .optional();

/**
 * Complete Smartphone Specs Schema
 */
export const SmartphoneSpecs = z.object({
  display: SmartphoneDisplay,
  processor: SmartphoneProcessor,
  camera: SmartphoneCamera,
  battery: SmartphoneBattery,
  storage: SmartphoneStorage,
  connectivity: SmartphoneConnectivity.optional(),
  physical: SmartphonePhysical,
  software: SmartphoneSoftware,
  ai: SmartphoneAI,
});

export type SmartphoneSpecs = z.infer<typeof SmartphoneSpecs>;

/**
 * Category metadata for smartphones
 */
export const SmartphoneCategoryMeta = {
  category: "celulares/smartphones",
  aliases: ["smartphones", "celulares"],
  min_completeness: 0.7,
  required_specs: [
    "display.size_inches",
    "display.resolution",
    "display.refresh_rate_hz",
    "processor.name",
    "camera.main_mp",
    "camera.video_max",
    "battery.capacity_mah",
    "storage.internal_gb",
    "storage.ram_gb",
    "physical.weight_grams",
    "software.os",
    "software.update_years",
  ],
  comparison_axes: [
    {
      name: "Camera",
      fields: ["camera.main_mp", "camera.zoom_optical", "camera.video_max"],
      description: "Qualidade e versatilidade da camera",
    },
    {
      name: "Performance",
      fields: ["processor.name", "storage.ram_gb"],
      description: "Poder de processamento e multitarefa",
    },
    {
      name: "Bateria",
      fields: ["battery.capacity_mah", "battery.fast_charge_watts"],
      description: "Duracao e velocidade de recarga",
    },
    {
      name: "Tela",
      fields: ["display.size_inches", "display.refresh_rate_hz", "display.technology"],
      description: "Qualidade visual e fluidez",
    },
    {
      name: "Longevidade",
      fields: ["software.update_years"],
      description: "Tempo de suporte e atualizacoes",
    },
  ],
} as const;
