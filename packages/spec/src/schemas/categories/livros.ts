import { z } from "zod";

/**
 * Book Format
 */
export const BookFormat = z.object({
  type: z.enum(["fisico", "ebook", "audiobook"]),
  binding: z.enum(["brochura", "capa-dura", "espiral", "pocket"]).optional(),
  pages: z.number().optional(),
  dimensions_cm: z.string().optional(), // "14x21"
  weight_grams: z.number().optional(),
  file_size_mb: z.number().optional(), // for ebooks
  duration_hours: z.number().optional(), // for audiobooks
});

/**
 * Book Publication Info
 */
export const BookPublication = z.object({
  publisher: z.string(),
  edition: z.number().optional(),
  year: z.number().optional(),
  original_year: z.number().optional(),
  language: z.string(),
  original_language: z.string().optional(),
  translator: z.string().optional(),
  isbn_10: z.string().optional(),
  isbn_13: z.string().optional(),
});

/**
 * Fiction Book Specs
 */
export const FictionBookSpecs = z.object({
  type: z.literal("ficcao"),
  genre: z.enum([
    "romance",
    "ficcao-cientifica",
    "fantasia",
    "terror",
    "suspense",
    "policial",
    "drama",
    "aventura",
    "historico",
    "jovem-adulto",
  ]),
  author: z.string(),
  series: z.string().optional(),
  series_number: z.number().optional(),
  format: BookFormat,
  publication: BookPublication,
  awards: z.array(z.string()).optional(),
  age_rating: z.string().optional(),
});

export type FictionBookSpecs = z.infer<typeof FictionBookSpecs>;

/**
 * Non-Fiction Book Specs
 */
export const NonFictionBookSpecs = z.object({
  type: z.literal("nao-ficcao"),
  category: z.enum([
    "biografia",
    "autoajuda",
    "negocios",
    "ciencia",
    "historia",
    "filosofia",
    "psicologia",
    "saude",
    "culinaria",
    "viagem",
    "arte",
    "tecnologia",
  ]),
  author: z.string(),
  format: BookFormat,
  publication: BookPublication,
  topics: z.array(z.string()).optional(),
  references: z.boolean().optional(),
});

export type NonFictionBookSpecs = z.infer<typeof NonFictionBookSpecs>;

/**
 * Textbook/Academic Book Specs
 */
export const TextbookSpecs = z.object({
  type: z.literal("didatico"),
  subject: z.string(),
  level: z.enum(["fundamental", "medio", "superior", "pos-graduacao", "profissional"]),
  author: z.string(),
  format: BookFormat,
  publication: BookPublication,
  exercises: z.boolean().optional(),
  answer_key: z.boolean().optional(),
  online_resources: z.boolean().optional(),
  approved_by: z.array(z.string()).optional(), // "MEC", "PNLD"
});

export type TextbookSpecs = z.infer<typeof TextbookSpecs>;

/**
 * Children's Book Specs
 */
export const ChildrensBookSpecs = z.object({
  type: z.literal("infantil"),
  age_range: z.object({
    min_years: z.number(),
    max_years: z.number().optional(),
  }),
  author: z.string(),
  illustrator: z.string().optional(),
  format: BookFormat,
  publication: BookPublication,
  interactive: z.boolean().optional(), // pop-up, touch-and-feel
  educational: z.boolean().optional(),
});

export type ChildrensBookSpecs = z.infer<typeof ChildrensBookSpecs>;

/**
 * Comic/Manga Specs
 */
export const ComicSpecs = z.object({
  type: z.enum(["hq", "manga", "graphic-novel"]),
  author: z.string(),
  illustrator: z.string().optional(),
  series: z.string().optional(),
  volume: z.number().optional(),
  format: BookFormat,
  publication: BookPublication,
  color: z.boolean().optional(),
  reading_direction: z.enum(["ltr", "rtl"]).optional(), // left-to-right or right-to-left (manga)
});

export type ComicSpecs = z.infer<typeof ComicSpecs>;

/**
 * Category metadata for books
 */
export const LivrosCategoryMeta = {
  category: "livros",
  aliases: ["books", "ebooks", "audiobooks", "literatura"],
  min_completeness: 0.6,
  required_specs: ["type", "author", "format", "publication"],
  subcategories: {
    ficcao: {
      required_specs: ["type", "genre", "author"],
    },
    "nao-ficcao": {
      required_specs: ["type", "category", "author"],
    },
    didatico: {
      required_specs: ["type", "subject", "level"],
    },
    infantil: {
      required_specs: ["type", "age_range", "author"],
    },
    hq: {
      required_specs: ["type", "author"],
    },
  },
  comparison_axes: [
    {
      name: "Formato",
      fields: ["format.type", "format.binding", "format.pages"],
      description: "Tipo e formato do livro",
    },
    {
      name: "Publicação",
      fields: ["publication.publisher", "publication.year", "publication.edition"],
      description: "Informações de publicação",
    },
    {
      name: "Conteúdo",
      fields: ["genre", "category", "subject"],
      description: "Gênero ou assunto",
    },
  ],
} as const;
