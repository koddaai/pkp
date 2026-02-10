import { z } from "zod";

/**
 * Camera Sensor Specs
 */
export const CameraSensor = z.object({
  type: z.string(), // "Full-Frame", "APS-C", "Micro Four Thirds"
  megapixels: z.number(),
  size_mm: z.string().optional(), // "35.9 x 23.9"
  iso_min: z.number().optional(),
  iso_max: z.number().optional(),
  bsi: z.boolean().optional(), // Backside Illuminated
});

/**
 * Camera Autofocus Specs
 */
export const CameraAutofocus = z.object({
  type: z.string(), // "Hybrid", "Phase Detection"
  points: z.number().optional(),
  coverage_percent: z.number().optional(),
  eye_af: z.boolean().optional(),
  animal_af: z.boolean().optional(),
  vehicle_af: z.boolean().optional(),
  tracking: z.boolean().optional(),
});

/**
 * Camera Video Specs
 */
export const CameraVideo = z.object({
  max_resolution: z.string(), // "8K", "4K"
  max_fps_4k: z.number().optional(),
  max_fps_1080p: z.number().optional(),
  log_profile: z.boolean().optional(),
  raw_video: z.boolean().optional(),
  slow_motion: z.string().optional(), // "1080p@120fps"
  stabilization: z.string().optional(), // "IBIS", "Digital"
});

/**
 * Camera Viewfinder/Display
 */
export const CameraViewfinder = z.object({
  type: z.string(), // "EVF", "OVF"
  evf_resolution: z.number().optional(), // Million dots
  evf_refresh_rate: z.number().optional(),
  lcd_size_inches: z.number().optional(),
  lcd_resolution: z.number().optional(), // Million dots
  lcd_articulating: z.boolean().optional(),
  lcd_touchscreen: z.boolean().optional(),
});

/**
 * Camera Body Specs
 */
export const CameraBody = z.object({
  mount: z.string(), // "Sony E", "Canon RF", "Nikon Z"
  weather_sealed: z.boolean().optional(),
  weight_grams: z.number(),
  dimensions_mm: z.string().optional(),
  battery_shots: z.number().optional(),
  dual_card_slots: z.boolean().optional(),
  card_types: z.array(z.string()).optional(), // ["CFexpress", "SD"]
});

/**
 * Camera Connectivity
 */
export const CameraConnectivity = z.object({
  wifi: z.boolean().optional(),
  bluetooth: z.boolean().optional(),
  usb: z.string().optional(), // "USB-C 3.2"
  hdmi: z.string().optional(),
  hotshoe: z.boolean().optional(),
  microphone_jack: z.boolean().optional(),
  headphone_jack: z.boolean().optional(),
});

/**
 * Complete Camera Specs Schema
 */
export const CameraSpecs = z.object({
  type: z.enum(["mirrorless", "dslr", "compact", "action", "instant"]),
  sensor: CameraSensor,
  autofocus: CameraAutofocus.optional(),
  video: CameraVideo,
  viewfinder: CameraViewfinder.optional(),
  body: CameraBody,
  connectivity: CameraConnectivity.optional(),
  continuous_shooting_fps: z.number().optional(),
});

export type CameraSpecs = z.infer<typeof CameraSpecs>;

/**
 * Category metadata for cameras
 */
export const CameraCategoryMeta = {
  category: "cameras",
  aliases: ["camera", "fotografia", "mirrorless", "dslr"],
  min_completeness: 0.65,
  required_specs: [
    "type",
    "sensor.megapixels",
    "sensor.type",
    "video.max_resolution",
    "body.mount",
    "body.weight_grams",
  ],
  comparison_axes: [
    {
      name: "Sensor",
      fields: ["sensor.type", "sensor.megapixels", "sensor.iso_max"],
      description: "Qualidade do sensor",
    },
    {
      name: "Autofoco",
      fields: ["autofocus.points", "autofocus.eye_af", "autofocus.tracking"],
      description: "Sistema de foco",
    },
    {
      name: "Video",
      fields: ["video.max_resolution", "video.max_fps_4k", "video.stabilization"],
      description: "Capacidades de video",
    },
    {
      name: "Corpo",
      fields: ["body.weight_grams", "body.weather_sealed", "body.battery_shots"],
      description: "Construcao e ergonomia",
    },
  ],
} as const;
