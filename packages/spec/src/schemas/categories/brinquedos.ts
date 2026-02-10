import { z } from "zod";

/**
 * Age Range for toys
 */
export const AgeRange = z.object({
  min_years: z.number(),
  max_years: z.number().optional(),
});

/**
 * Safety Certifications
 */
export const ToySafety = z.object({
  inmetro: z.boolean().optional(),
  ce: z.boolean().optional(),
  astm: z.boolean().optional(),
  choking_hazard: z.boolean().optional(),
  small_parts: z.boolean().optional(),
});

/**
 * Building/Construction Toy Specs (LEGO, blocks)
 */
export const BuildingToySpecs = z.object({
  type: z.enum(["lego", "blocos", "quebra-cabeca", "modelismo", "magnético"]),
  pieces: z.number(),
  theme: z.string().optional(), // "Star Wars", "City", etc.
  age_range: AgeRange,
  dimensions_cm: z.string().optional(), // assembled dimensions
  compatible_with: z.array(z.string()).optional(),
  minifigures: z.number().optional(),
  motorized: z.boolean().optional(),
  safety: ToySafety.optional(),
});

export type BuildingToySpecs = z.infer<typeof BuildingToySpecs>;

/**
 * Doll/Action Figure Specs
 */
export const DollSpecs = z.object({
  type: z.enum(["boneca", "action-figure", "pelucia", "fantoche"]),
  character: z.string().optional(),
  franchise: z.string().optional(), // "Barbie", "Marvel", etc.
  height_cm: z.number().optional(),
  articulations: z.number().optional(),
  accessories_included: z.boolean().optional(),
  age_range: AgeRange,
  batteries_required: z.boolean().optional(),
  sounds: z.boolean().optional(),
  safety: ToySafety.optional(),
});

export type DollSpecs = z.infer<typeof DollSpecs>;

/**
 * Board Game Specs
 */
export const BoardGameSpecs = z.object({
  type: z.enum(["tabuleiro", "cartas", "estrategia", "party", "cooperativo", "rpg"]),
  players_min: z.number(),
  players_max: z.number(),
  duration_minutes: z.number().optional(),
  complexity: z.enum(["facil", "medio", "avancado"]).optional(),
  age_range: AgeRange,
  language: z.string().optional(),
  expansion: z.boolean().optional(),
  base_game_required: z.string().optional(),
  components: z.array(z.string()).optional(),
});

export type BoardGameSpecs = z.infer<typeof BoardGameSpecs>;

/**
 * Vehicle/RC Toy Specs
 */
export const VehicleToySpecs = z.object({
  type: z.enum(["carrinho", "controle-remoto", "pista", "drone", "helicoptero"]),
  scale: z.string().optional(), // "1:18", "1:24"
  remote_control: z.boolean().optional(),
  rc_range_meters: z.number().optional(),
  speed_kmh: z.number().optional(),
  battery_type: z.string().optional(),
  battery_life_minutes: z.number().optional(),
  age_range: AgeRange,
  indoor_outdoor: z.enum(["indoor", "outdoor", "both"]).optional(),
  safety: ToySafety.optional(),
});

export type VehicleToySpecs = z.infer<typeof VehicleToySpecs>;

/**
 * Educational Toy Specs
 */
export const EducationalToySpecs = z.object({
  type: z.enum(["stem", "ciencia", "arte", "musica", "idiomas", "montessori"]),
  skills: z.array(z.string()), // ["logica", "motricidade", "criatividade"]
  subject: z.string().optional(),
  interactive: z.boolean().optional(),
  app_connected: z.boolean().optional(),
  age_range: AgeRange,
  batteries_required: z.boolean().optional(),
  safety: ToySafety.optional(),
});

export type EducationalToySpecs = z.infer<typeof EducationalToySpecs>;

/**
 * Category metadata for toys
 */
export const BrinquedosCategoryMeta = {
  category: "brinquedos",
  aliases: ["toys", "jogos-infantis", "games-kids"],
  min_completeness: 0.5,
  required_specs: ["type", "age_range"],
  subcategories: {
    lego: {
      required_specs: ["type", "pieces", "age_range"],
    },
    bonecas: {
      required_specs: ["type", "age_range"],
    },
    tabuleiro: {
      required_specs: ["type", "players_min", "players_max"],
    },
    "controle-remoto": {
      required_specs: ["type", "age_range"],
    },
    educativos: {
      required_specs: ["type", "skills", "age_range"],
    },
  },
  comparison_axes: [
    {
      name: "Idade",
      fields: ["age_range.min_years", "age_range.max_years"],
      description: "Faixa etária recomendada",
    },
    {
      name: "Complexidade",
      fields: ["pieces", "complexity", "duration_minutes"],
      description: "Nível de dificuldade",
    },
    {
      name: "Jogadores",
      fields: ["players_min", "players_max"],
      description: "Número de jogadores",
    },
    {
      name: "Segurança",
      fields: ["safety.inmetro", "safety.choking_hazard"],
      description: "Certificações de segurança",
    },
  ],
} as const;
