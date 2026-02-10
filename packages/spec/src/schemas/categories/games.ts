import { z } from "zod";

/**
 * Console Processor Specs
 */
export const ConsoleProcessor = z.object({
  cpu: z.string(), // "AMD Zen 2 8-core"
  cpu_frequency_ghz: z.number().optional(),
  gpu: z.string(), // "AMD RDNA 3 custom"
  gpu_tflops: z.number().optional(),
  gpu_improvement: z.string().optional(), // "67% vs PS5"
});

/**
 * Console Memory Specs
 */
export const ConsoleMemory = z.object({
  ram_gb: z.number(),
  type: z.string(), // "GDDR6"
  bandwidth_gbs: z.number().optional(),
});

/**
 * Console Storage Specs
 */
export const ConsoleStorage = z.object({
  ssd_gb: z.number(),
  type: z.string(), // "Custom NVMe SSD"
  speed_gbs: z.number().optional(),
  expandable: z.boolean().optional(),
});

/**
 * Console Video Specs
 */
export const ConsoleVideo = z.object({
  max_resolution: z.string(), // "8K"
  target_resolution: z.string().optional(), // "4K"
  hdr: z.boolean().optional(),
  ray_tracing: z.union([z.boolean(), z.string()]).optional(), // true or "Advanced"
  upscaling: z.string().optional(), // "PSSR AI", "FSR"
  frame_rate: z.array(z.string()).optional(), // ["60fps", "120fps"]
  vrr: z.boolean().optional(),
});

/**
 * Console Audio Specs
 */
export const ConsoleAudio = z.object({
  technology: z.string(), // "Tempest 3D AudioTech"
  formats: z.array(z.string()).optional(), // ["Dolby Atmos", "DTS:X"]
});

/**
 * Console Connectivity Specs
 */
export const ConsoleConnectivity = z.object({
  hdmi: z.string(), // "HDMI 2.1"
  usb: z.array(z.string()), // ["USB-A 10Gbps x2", "USB-C 10Gbps x2"]
  wifi: z.string(), // "Wi-Fi 7"
  bluetooth: z.string().optional(),
  ethernet: z.string().optional(), // "Gigabit"
});

/**
 * Console Physical Specs
 */
export const ConsolePhysical = z.object({
  height_mm: z.number().optional(),
  width_mm: z.number().optional(),
  depth_mm: z.number().optional(),
  weight_kg: z.number().optional(),
  color: z.string().optional(),
  disc_drive: z.boolean().optional(),
});

/**
 * Console Power Specs
 */
export const ConsolePower = z
  .object({
    consumption_watts: z.number().optional(),
  })
  .optional();

/**
 * Console Features
 */
export const ConsoleFeatures = z.object({
  backwards_compatible: z.boolean().optional(),
  ps_vr2_compatible: z.boolean().optional(),
  game_boost: z.boolean().optional(),
});

/**
 * Complete Console Specs Schema
 */
export const ConsoleSpecs = z.object({
  processor: ConsoleProcessor,
  memory: ConsoleMemory,
  storage: ConsoleStorage,
  video: ConsoleVideo,
  audio: ConsoleAudio,
  connectivity: ConsoleConnectivity,
  physical: ConsolePhysical.optional(),
  power: ConsolePower,
  features: ConsoleFeatures.optional(),
});

export type ConsoleSpecs = z.infer<typeof ConsoleSpecs>;

/**
 * Game Title Specs (for games, not consoles)
 */
export const GameTitleSpecs = z.object({
  platforms: z.array(z.string()), // ["PS5", "Xbox Series X", "PC"]
  genre: z.array(z.string()), // ["Action", "RPG"]
  players: z
    .object({
      local: z.number().optional(),
      online: z.number().optional(),
    })
    .optional(),
  rating: z
    .object({
      esrb: z.string().optional(), // "M", "T", "E"
      classind: z.string().optional(), // "18", "16", "12"
    })
    .optional(),
  features: z.array(z.string()).optional(), // ["4K", "HDR", "Ray Tracing"]
});

export type GameTitleSpecs = z.infer<typeof GameTitleSpecs>;

/**
 * Category metadata for games
 */
export const GamesCategoryMeta = {
  category: "games",
  aliases: ["consoles", "videogames", "gaming"],
  min_completeness: 0.6,
  required_specs: [],
  subcategories: {
    consoles: {
      required_specs: [
        "processor.cpu",
        "processor.gpu",
        "memory.ram_gb",
        "storage.ssd_gb",
        "video.max_resolution",
        "connectivity.hdmi",
      ],
    },
    jogos: {
      required_specs: ["platforms", "genre"],
    },
    acessorios: {
      required_specs: [],
    },
  },
  comparison_axes: [
    {
      name: "Performance",
      fields: ["processor.gpu_tflops", "memory.ram_gb", "storage.speed_gbs"],
      description: "Poder grafico e velocidade",
    },
    {
      name: "Video",
      fields: ["video.max_resolution", "video.ray_tracing", "video.frame_rate"],
      description: "Qualidade de imagem e fluidez",
    },
    {
      name: "Armazenamento",
      fields: ["storage.ssd_gb", "storage.expandable"],
      description: "Espaco para jogos",
    },
    {
      name: "Conectividade",
      fields: ["connectivity.wifi", "connectivity.usb"],
      description: "Opcoes de conexao",
    },
    {
      name: "Ecossistema",
      fields: ["features.backwards_compatible"],
      description: "Compatibilidade com jogos anteriores",
    },
  ],
} as const;
