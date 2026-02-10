import { z } from "zod";

/**
 * Audio Driver Specs
 */
export const AudioDriver = z.object({
  size_mm: z.number().optional(),
  type: z.string().optional(), // "dynamic", "balanced armature", "planar"
  frequency_response: z.string().optional(), // "20Hz-20kHz"
});

/**
 * Audio Noise Cancellation Specs
 */
export const AudioANC = z.object({
  active: z.boolean(),
  transparency_mode: z.boolean().optional(),
  adaptive: z.boolean().optional(),
});

/**
 * Audio Battery Specs (for wireless)
 */
export const AudioBattery = z.object({
  hours_playback: z.number().optional(),
  hours_with_case: z.number().optional(),
  fast_charge_minutes: z.number().optional(),
  wireless_charging: z.boolean().optional(),
});

/**
 * Audio Connectivity Specs
 */
export const AudioConnectivity = z.object({
  bluetooth: z.string().optional(), // "5.3"
  bluetooth_codecs: z.array(z.string()).optional(), // ["AAC", "LDAC", "aptX"]
  wired: z.boolean().optional(),
  jack_mm: z.number().optional(), // 3.5
  multipoint: z.boolean().optional(),
});

/**
 * Headphone-specific Specs
 */
export const HeadphoneSpecs = z.object({
  type: z.enum(["over-ear", "on-ear", "in-ear", "earbuds"]),
  driver: AudioDriver.optional(),
  anc: AudioANC.optional(),
  battery: AudioBattery.optional(),
  connectivity: AudioConnectivity,
  microphone: z.boolean().optional(),
  foldable: z.boolean().optional(),
  weight_grams: z.number().optional(),
  ip_rating: z.string().optional(),
  colors: z.array(z.string()).optional(),
});

export type HeadphoneSpecs = z.infer<typeof HeadphoneSpecs>;

/**
 * Speaker-specific Specs
 */
export const SpeakerSpecs = z.object({
  type: z.enum(["portable", "bookshelf", "soundbar", "subwoofer", "smart"]),
  power_watts: z.number().optional(),
  channels: z.string().optional(), // "2.1", "5.1"
  driver: AudioDriver.optional(),
  battery: AudioBattery.optional(),
  connectivity: AudioConnectivity,
  voice_assistant: z.array(z.string()).optional(), // ["Alexa", "Google"]
  waterproof: z.boolean().optional(),
  ip_rating: z.string().optional(),
  dimensions_cm: z.string().optional(),
  weight_grams: z.number().optional(),
  colors: z.array(z.string()).optional(),
});

export type SpeakerSpecs = z.infer<typeof SpeakerSpecs>;

/**
 * Category metadata for audio
 */
export const AudioCategoryMeta = {
  category: "audio",
  aliases: ["headphones", "speakers", "earbuds", "fones", "caixas-de-som"],
  min_completeness: 0.6,
  required_specs: ["type", "connectivity.bluetooth"],
  subcategories: {
    headphones: {
      required_specs: ["type"],
    },
    earbuds: {
      required_specs: ["type", "battery.hours_playback"],
    },
    speakers: {
      required_specs: ["type"],
    },
  },
  comparison_axes: [
    {
      name: "Som",
      fields: ["driver.type", "driver.frequency_response"],
      description: "Qualidade de audio",
    },
    {
      name: "ANC",
      fields: ["anc.active", "anc.transparency_mode"],
      description: "Cancelamento de ruido",
    },
    {
      name: "Bateria",
      fields: ["battery.hours_playback", "battery.hours_with_case"],
      description: "Duracao da bateria",
    },
    {
      name: "Conectividade",
      fields: ["connectivity.bluetooth", "connectivity.multipoint"],
      description: "Opcoes de conexao",
    },
  ],
} as const;
