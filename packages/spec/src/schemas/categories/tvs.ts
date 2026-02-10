import { z } from "zod";

/**
 * TV Display Specs
 */
export const TVDisplay = z.object({
  size_inches: z.number().min(24).max(100),
  technology: z.string(), // "OLED", "QLED", "Neo QLED", "LED", "Mini LED"
  resolution: z.string(), // "3840x2160"
  refresh_rate_hz: z.number().min(50).max(240),
  hdr: z.array(z.string()).optional(), // ["HDR10+", "Dolby Vision", "HLG"]
  brightness_nits: z.number().optional(),
  contrast: z.string().optional(), // "Quantum Matrix Technology"
  dimming_zones: z.number().optional(),
  viewing_angle: z.number().optional(),
});

/**
 * TV Processor Specs
 */
export const TVProcessor = z.object({
  name: z.string(), // "Neural Quantum Processor 4K"
  ai_upscaling: z.boolean().optional(),
});

/**
 * TV Audio Specs
 */
export const TVAudio = z.object({
  speakers: z.string(), // "60W 2.2.2 canais"
  dolby_atmos: z.boolean().optional(),
  dts: z.boolean().optional(),
  object_tracking_sound: z.boolean().optional(),
});

/**
 * TV Smart Features
 */
export const TVSmart = z.object({
  os: z.string(), // "Tizen", "webOS", "Google TV"
  voice_assistants: z.array(z.string()).optional(), // ["Bixby", "Alexa", "Google Assistant"]
  apps: z.array(z.string()).optional(), // ["Netflix", "Prime Video"]
  airplay: z.boolean().optional(),
  screen_mirroring: z.boolean().optional(),
});

/**
 * TV Gaming Specs
 */
export const TVGaming = z
  .object({
    vrr: z.boolean().optional(), // Variable Refresh Rate
    allm: z.boolean().optional(), // Auto Low Latency Mode
    game_mode: z.boolean().optional(),
    input_lag_ms: z.number().optional(),
    gaming_hub: z.boolean().optional(),
    cloud_gaming: z.array(z.string()).optional(), // ["Xbox Cloud Gaming", "GeForce NOW"]
  })
  .optional();

/**
 * TV Connectivity Specs
 */
export const TVConnectivity = z.object({
  hdmi_ports: z.number().min(1).max(5),
  hdmi_21: z.number().optional(), // Number of HDMI 2.1 ports
  usb_ports: z.number().optional(),
  ethernet: z.boolean().optional(),
  wifi: z.string().optional(), // "Wi-Fi 6"
  bluetooth: z.string().optional(),
  earc: z.boolean().optional(),
});

/**
 * TV Physical Specs
 */
export const TVPhysical = z.object({
  weight_kg: z.number().optional(),
  weight_with_stand_kg: z.number().optional(),
  vesa: z.string().optional(), // "300x300"
  thickness_mm: z.number().optional(),
});

/**
 * TV Energy Specs
 */
export const TVEnergy = z
  .object({
    consumption_watts: z.number().optional(),
    standby_watts: z.number().optional(),
    energy_rating: z.string().optional(), // "A", "B", "C"
  })
  .optional();

/**
 * Complete TV Specs Schema
 */
export const TVSpecs = z.object({
  display: TVDisplay,
  processor: TVProcessor.optional(),
  audio: TVAudio,
  smart: TVSmart,
  gaming: TVGaming,
  connectivity: TVConnectivity,
  physical: TVPhysical.optional(),
  energy: TVEnergy,
});

export type TVSpecs = z.infer<typeof TVSpecs>;

/**
 * Category metadata for TVs
 */
export const TVCategoryMeta = {
  category: "tvs",
  aliases: ["televisores", "televisao", "tv", "smart-tv"],
  min_completeness: 0.6,
  required_specs: [
    "display.size_inches",
    "display.technology",
    "display.resolution",
    "display.refresh_rate_hz",
    "audio.speakers",
    "smart.os",
    "connectivity.hdmi_ports",
  ],
  comparison_axes: [
    {
      name: "Qualidade de Imagem",
      fields: ["display.technology", "display.brightness_nits", "display.hdr"],
      description: "Tecnologia de painel e qualidade HDR",
    },
    {
      name: "Gaming",
      fields: ["gaming.vrr", "gaming.input_lag_ms", "connectivity.hdmi_21"],
      description: "Recursos para jogos e latencia",
    },
    {
      name: "Audio",
      fields: ["audio.speakers", "audio.dolby_atmos"],
      description: "Qualidade de som integrado",
    },
    {
      name: "Smart",
      fields: ["smart.os", "smart.apps", "smart.voice_assistants"],
      description: "Sistema operacional e apps",
    },
    {
      name: "Tamanho",
      fields: ["display.size_inches", "physical.weight_kg"],
      description: "Dimensoes e peso",
    },
  ],
} as const;
