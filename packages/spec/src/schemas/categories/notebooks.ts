import { z } from "zod";

/**
 * Notebook Display Specs
 */
export const NotebookDisplay = z.object({
  size_inches: z.number().min(11).max(18),
  technology: z.string(), // "IPS", "OLED", "Liquid Retina"
  resolution: z.string(), // "2880x1800"
  refresh_rate_hz: z.number().min(60).max(240),
  brightness_nits: z.number().optional(),
  color_gamut: z.string().optional(), // "P3", "sRGB", "100% DCI-P3"
  hdr: z.union([z.boolean(), z.string()]).optional(), // true or "DisplayHDR 500"
  touch: z.boolean().optional(),
  true_tone: z.boolean().optional(),
});

/**
 * Notebook Processor Specs
 */
export const NotebookProcessor = z.object({
  name: z.string(), // "Apple M4", "Intel Core Ultra 7 155H"
  cpu_cores: z.number().min(2).max(32).optional(),
  gpu_cores: z.number().optional(), // For Apple Silicon
  cores: z.number().optional(), // Total cores
  threads: z.number().optional(),
  base_ghz: z.number().optional(),
  turbo_ghz: z.number().optional(),
  manufacturing_nm: z.number().optional(),
  neural_engine_cores: z.number().optional(),
  npu: z.boolean().optional(),
});

/**
 * Notebook GPU Specs (for dedicated GPU)
 */
export const NotebookGPU = z
  .object({
    integrated: z.string().optional(),
    dedicated: z.string().optional(),
    vram_gb: z.number().optional(),
  })
  .optional();

/**
 * Notebook Memory Specs
 */
export const NotebookMemory = z.object({
  ram_gb: z.number().min(4).max(128),
  type: z.string(), // "LPDDR5x", "DDR5", "Unified Memory"
  speed_mhz: z.number().optional(),
  max_gb: z.number().optional(),
  expandable: z.boolean().optional(),
});

/**
 * Notebook Storage Specs
 */
export const NotebookStorage = z.object({
  ssd_gb: z.number().min(128).max(8192),
  type: z.string(), // "NVMe PCIe 4.0", "SSD NVMe"
  expandable: z.boolean().optional(),
});

/**
 * Notebook Battery Specs
 */
export const NotebookBattery = z.object({
  capacity_wh: z.number().min(30).max(120),
  hours_video: z.number().optional(),
  hours_web: z.number().optional(),
  fast_charge: z.boolean().optional(),
  magsafe: z.boolean().optional(),
});

/**
 * Notebook Connectivity Specs
 */
export const NotebookConnectivity = z.object({
  wifi: z.string(), // "Wi-Fi 6E", "Wi-Fi 7"
  bluetooth: z.string(), // "5.3"
  ports: z.array(z.string()), // ["Thunderbolt 4 x2", "USB-A", "HDMI"]
  thunderbolt_ports: z.number().optional(),
});

/**
 * Notebook Physical Specs
 */
export const NotebookPhysical = z.object({
  weight_kg: z.number().min(0.5).max(4),
  thickness_mm: z.number().optional(),
  material: z.string().optional(), // "Aluminio CNC", "Aluminio reciclado"
  colors: z.array(z.string()).optional(),
});

/**
 * Notebook Audio Specs
 */
export const NotebookAudio = z
  .object({
    speakers: z.string(), // "6 alto-falantes com Spatial Audio"
    microphones: z.string().optional(),
  })
  .optional();

/**
 * Notebook Camera Specs
 */
export const NotebookCamera = z
  .object({
    resolution: z.string(), // "1080p FaceTime HD"
    center_stage: z.boolean().optional(),
    ir: z.boolean().optional(),
    windows_hello: z.boolean().optional(),
  })
  .optional();

/**
 * Notebook Keyboard Specs
 */
export const NotebookKeyboard = z
  .object({
    type: z.string(), // "Magic Keyboard", "Full-size backlit"
    backlit: z.boolean().optional(),
    touch_id: z.boolean().optional(),
    fingerprint: z.boolean().optional(),
  })
  .optional();

/**
 * Notebook Software Specs
 */
export const NotebookSoftware = z.object({
  os: z.string(), // "macOS Sonoma", "Windows 11 Pro"
  update_years: z.number().optional(),
});

/**
 * Complete Notebook Specs Schema
 */
export const NotebookSpecs = z.object({
  display: NotebookDisplay,
  processor: NotebookProcessor,
  gpu: NotebookGPU,
  memory: NotebookMemory,
  storage: NotebookStorage,
  battery: NotebookBattery,
  connectivity: NotebookConnectivity,
  physical: NotebookPhysical,
  audio: NotebookAudio,
  camera: NotebookCamera,
  keyboard: NotebookKeyboard,
  software: NotebookSoftware,
});

export type NotebookSpecs = z.infer<typeof NotebookSpecs>;

/**
 * Category metadata for notebooks
 */
export const NotebookCategoryMeta = {
  category: "notebooks",
  aliases: ["laptops", "notebook", "laptop"],
  min_completeness: 0.7,
  required_specs: [
    "display.size_inches",
    "display.resolution",
    "processor.name",
    "memory.ram_gb",
    "storage.ssd_gb",
    "battery.capacity_wh",
    "physical.weight_kg",
    "software.os",
  ],
  comparison_axes: [
    {
      name: "Performance",
      fields: ["processor.name", "memory.ram_gb", "gpu.dedicated"],
      description: "Poder de processamento para tarefas pesadas",
    },
    {
      name: "Portabilidade",
      fields: ["physical.weight_kg", "physical.thickness_mm", "battery.hours_video"],
      description: "Facilidade de transporte e autonomia",
    },
    {
      name: "Tela",
      fields: ["display.size_inches", "display.resolution", "display.technology"],
      description: "Qualidade visual e tamanho",
    },
    {
      name: "Conectividade",
      fields: ["connectivity.ports", "connectivity.thunderbolt_ports"],
      description: "Opcoes de conexao e expansao",
    },
    {
      name: "Armazenamento",
      fields: ["storage.ssd_gb", "storage.type"],
      description: "Espaco e velocidade de disco",
    },
  ],
} as const;
