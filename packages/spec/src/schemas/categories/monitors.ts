import { z } from "zod";

/**
 * Monitor Panel Specs
 */
export const MonitorPanel = z.object({
  size_inches: z.number().min(15).max(65),
  resolution: z.string(), // "3840x2160"
  aspect_ratio: z.string().optional(), // "16:9", "21:9"
  panel_type: z.string(), // "IPS", "VA", "OLED", "Mini-LED"
  refresh_rate_hz: z.number().min(60).max(500),
  response_time_ms: z.number().optional(),
  brightness_nits: z.number().optional(),
  contrast_ratio: z.string().optional(), // "1000:1"
  hdr: z.array(z.string()).optional(), // ["HDR10", "HDR400"]
  color_gamut: z.object({
    srgb: z.number().optional(),
    dci_p3: z.number().optional(),
    adobe_rgb: z.number().optional(),
  }).optional(),
  bit_depth: z.number().optional(), // 8, 10
});

/**
 * Monitor Gaming Features
 */
export const MonitorGaming = z.object({
  adaptive_sync: z.string().optional(), // "G-Sync", "FreeSync Premium"
  vrr: z.boolean().optional(),
  motion_blur_reduction: z.boolean().optional(),
  low_input_lag: z.boolean().optional(),
  crosshair: z.boolean().optional(),
});

/**
 * Monitor Connectivity
 */
export const MonitorConnectivity = z.object({
  hdmi: z.number().optional(), // Number of ports
  hdmi_version: z.string().optional(), // "2.1"
  displayport: z.number().optional(),
  displayport_version: z.string().optional(),
  usb_c: z.number().optional(),
  usb_c_power_delivery: z.number().optional(), // Watts
  usb_hub: z.number().optional(), // Number of USB ports
  thunderbolt: z.boolean().optional(),
  kvm: z.boolean().optional(),
});

/**
 * Monitor Ergonomics
 */
export const MonitorErgonomics = z.object({
  height_adjust: z.boolean().optional(),
  tilt: z.boolean().optional(),
  swivel: z.boolean().optional(),
  pivot: z.boolean().optional(),
  vesa_mount: z.string().optional(), // "100x100"
  curved: z.boolean().optional(),
  curvature: z.string().optional(), // "1000R"
});

/**
 * Monitor Physical Specs
 */
export const MonitorPhysical = z.object({
  weight_kg: z.number().optional(),
  dimensions_cm: z.string().optional(),
  speakers: z.boolean().optional(),
  speakers_watts: z.number().optional(),
});

/**
 * Complete Monitor Specs Schema
 */
export const MonitorSpecs = z.object({
  panel: MonitorPanel,
  gaming: MonitorGaming.optional(),
  connectivity: MonitorConnectivity,
  ergonomics: MonitorErgonomics.optional(),
  physical: MonitorPhysical.optional(),
  use_case: z.enum(["general", "gaming", "professional", "office"]).optional(),
});

export type MonitorSpecs = z.infer<typeof MonitorSpecs>;

/**
 * Category metadata for monitors
 */
export const MonitorCategoryMeta = {
  category: "monitors",
  aliases: ["monitor", "display", "tela"],
  min_completeness: 0.65,
  required_specs: [
    "panel.size_inches",
    "panel.resolution",
    "panel.panel_type",
    "panel.refresh_rate_hz",
  ],
  comparison_axes: [
    {
      name: "Imagem",
      fields: ["panel.resolution", "panel.panel_type", "panel.hdr"],
      description: "Qualidade de imagem",
    },
    {
      name: "Gaming",
      fields: ["panel.refresh_rate_hz", "panel.response_time_ms", "gaming.adaptive_sync"],
      description: "Performance para jogos",
    },
    {
      name: "Conectividade",
      fields: ["connectivity.hdmi", "connectivity.usb_c", "connectivity.displayport"],
      description: "Opcoes de conexao",
    },
    {
      name: "Ergonomia",
      fields: ["ergonomics.height_adjust", "ergonomics.pivot", "ergonomics.curved"],
      description: "Ajustes e conforto",
    },
  ],
} as const;
