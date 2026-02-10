import { describe, it, expect } from "vitest";
import {
  // Utility functions
  getCategoryMeta,
  getCategoryMinCompleteness,
  getCategoryRequiredSpecs,
  getCategoryComparisonAxes,
  getCategorySpecsSchema,
  validateCategorySpecs,
  listCategories,
  isCategorySupported,
  // Category metadata
  CATEGORY_METADATA,
  CATEGORY_SPECS_SCHEMAS,
  // Specific schemas
  SmartphoneSpecs,
  SmartphoneCategoryMeta,
  NotebookSpecs,
  NotebookCategoryMeta,
  TVSpecs,
  TVCategoryMeta,
  FootwearSpecs,
  ModaCategoryMeta,
  ConsoleSpecs,
  GamesCategoryMeta,
  DishwasherSpecs,
  EletrodomesticosCategoryMeta,
} from "../src/schemas/categories/index.js";

describe("Category Utility Functions", () => {
  describe("listCategories", () => {
    it("should list all supported categories", () => {
      const categories = listCategories();

      expect(categories).toContain("smartphones");
      expect(categories).toContain("notebooks");
      expect(categories).toContain("tvs");
      expect(categories).toContain("moda");
      expect(categories).toContain("games");
      expect(categories).toContain("eletrodomesticos");
    });
  });

  describe("isCategorySupported", () => {
    it("should return true for supported categories", () => {
      expect(isCategorySupported("smartphones")).toBe(true);
      expect(isCategorySupported("notebooks")).toBe(true);
      expect(isCategorySupported("tvs")).toBe(true);
    });

    it("should return true for category aliases", () => {
      expect(isCategorySupported("celulares")).toBe(true);
      expect(isCategorySupported("televisores")).toBe(true);
    });

    it("should return false for unsupported categories", () => {
      expect(isCategorySupported("unknown")).toBe(false);
      expect(isCategorySupported("invalid")).toBe(false);
    });
  });

  describe("getCategoryMeta", () => {
    it("should return metadata for direct category match", () => {
      const meta = getCategoryMeta("smartphones");

      expect(meta).toBeDefined();
      expect(meta?.category).toBe("celulares/smartphones");
      expect(meta?.min_completeness).toBe(0.7);
    });

    it("should return metadata for category alias", () => {
      const meta = getCategoryMeta("celulares");

      expect(meta).toBeDefined();
      expect(meta?.category).toBe("celulares/smartphones");
    });

    it("should return metadata for subcategory path", () => {
      const meta = getCategoryMeta("celulares/smartphones");

      expect(meta).toBeDefined();
      expect(meta?.category).toBe("celulares/smartphones");
    });

    it("should return undefined for unknown category", () => {
      expect(getCategoryMeta("unknown")).toBeUndefined();
    });
  });

  describe("getCategoryMinCompleteness", () => {
    it("should return correct thresholds", () => {
      expect(getCategoryMinCompleteness("smartphones")).toBe(0.7);
      expect(getCategoryMinCompleteness("notebooks")).toBe(0.7);
      expect(getCategoryMinCompleteness("tvs")).toBe(0.6);
      expect(getCategoryMinCompleteness("moda")).toBe(0.5);
      expect(getCategoryMinCompleteness("games")).toBe(0.6);
      expect(getCategoryMinCompleteness("eletrodomesticos")).toBe(0.6);
    });

    it("should return default for unknown category", () => {
      expect(getCategoryMinCompleteness("unknown")).toBe(0.6);
    });
  });

  describe("getCategoryRequiredSpecs", () => {
    it("should return required specs for smartphones", () => {
      const required = getCategoryRequiredSpecs("smartphones");

      expect(required).toContain("display.size_inches");
      expect(required).toContain("processor.name");
      expect(required).toContain("camera.main_mp");
      expect(required).toContain("battery.capacity_mah");
    });

    it("should return required specs for notebooks", () => {
      const required = getCategoryRequiredSpecs("notebooks");

      expect(required).toContain("display.size_inches");
      expect(required).toContain("processor.name");
      expect(required).toContain("storage.ssd_gb");
    });

    it("should return empty array for unknown category", () => {
      expect(getCategoryRequiredSpecs("unknown")).toEqual([]);
    });
  });

  describe("getCategoryComparisonAxes", () => {
    it("should return comparison axes for smartphones", () => {
      const axes = getCategoryComparisonAxes("smartphones");

      expect(axes.length).toBeGreaterThan(0);
      expect(axes.some((a) => a.name === "Camera")).toBe(true);
      expect(axes.some((a) => a.name === "Performance")).toBe(true);
      expect(axes.some((a) => a.name === "Bateria")).toBe(true);
    });

    it("should return empty array for unknown category", () => {
      expect(getCategoryComparisonAxes("unknown")).toEqual([]);
    });
  });

  describe("getCategorySpecsSchema", () => {
    it("should return schema for category", () => {
      const schema = getCategorySpecsSchema("smartphones");
      expect(schema).toBeDefined();
    });

    it("should return schema for subcategory", () => {
      const schema = getCategorySpecsSchema("moda", "tenis-casual");
      expect(schema).toBeDefined();
    });

    it("should return undefined for unknown category", () => {
      expect(getCategorySpecsSchema("unknown")).toBeUndefined();
    });
  });

  describe("validateCategorySpecs", () => {
    it("should validate valid smartphone specs", () => {
      const specs = {
        display: {
          size_inches: 6.8,
          technology: "Dynamic AMOLED 2X",
          resolution: "3120x1440",
          refresh_rate_hz: 120,
        },
        processor: {
          name: "Snapdragon 8 Elite",
          cores: 8,
        },
        camera: {
          main_mp: 200,
          video_max: "8K@30fps",
        },
        battery: {
          capacity_mah: 5000,
        },
        storage: {
          internal_gb: 256,
          ram_gb: 12,
        },
        physical: {
          weight_grams: 232,
        },
        software: {
          os: "Android 15",
          update_years: 7,
        },
      };

      const result = validateCategorySpecs("smartphones", undefined, specs);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid smartphone specs", () => {
      const specs = {
        display: {
          size_inches: 15, // Too large
          technology: "LCD",
          resolution: "1920x1080",
          refresh_rate_hz: 60,
        },
      };

      const result = validateCategorySpecs("smartphones", undefined, specs);

      expect(result.valid).toBe(false);
    });

    it("should return valid for unknown category (no schema)", () => {
      const result = validateCategorySpecs("unknown", undefined, { any: "data" });

      expect(result.valid).toBe(true);
    });
  });
});

describe("Smartphone Schema", () => {
  it("should validate complete smartphone specs", () => {
    const specs = {
      display: {
        size_inches: 6.8,
        technology: "Dynamic AMOLED 2X",
        resolution: "3120x1440",
        refresh_rate_hz: 120,
        brightness_nits: 2600,
        hdr: true,
        always_on: true,
        gorilla_glass: "Armor 2",
      },
      processor: {
        name: "Snapdragon 8 Elite",
        cores: 8,
        manufacturing_nm: 3,
      },
      camera: {
        main_mp: 200,
        ultrawide_mp: 12,
        telephoto_mp: 50,
        zoom_optical: 5,
        video_max: "8K@30fps",
        ois: true,
      },
      battery: {
        capacity_mah: 5000,
        fast_charge_watts: 45,
        wireless_charge: true,
        wireless_charge_watts: 15,
      },
      storage: {
        internal_gb: 256,
        ram_gb: 12,
      },
      connectivity: {
        five_g: true,
        wifi: "Wi-Fi 7",
        bluetooth: "5.4",
        nfc: true,
      },
      physical: {
        weight_grams: 232,
        thickness_mm: 8.6,
        ip_rating: "IP68",
        has_stylus: true,
        colors: ["Titanium Black", "Titanium Gray"],
      },
      software: {
        os: "Android 15",
        ui: "One UI 7",
        update_years: 7,
      },
      ai: {
        features: ["Galaxy AI", "Circle to Search"],
      },
    };

    const result = SmartphoneSpecs.safeParse(specs);

    expect(result.success).toBe(true);
  });

  it("should reject specs with display size out of range", () => {
    const specs = {
      display: {
        size_inches: 10, // Too large (max 8)
        technology: "LCD",
        resolution: "1920x1080",
        refresh_rate_hz: 60,
      },
      processor: { name: "Test", cores: 8 },
      camera: { main_mp: 12, video_max: "4K@30fps" },
      battery: { capacity_mah: 4000 },
      storage: { internal_gb: 128, ram_gb: 8 },
      physical: { weight_grams: 200 },
      software: { os: "Android", update_years: 2 },
    };

    const result = SmartphoneSpecs.safeParse(specs);

    expect(result.success).toBe(false);
  });

  it("should have correct category metadata", () => {
    expect(SmartphoneCategoryMeta.category).toBe("celulares/smartphones");
    expect(SmartphoneCategoryMeta.min_completeness).toBe(0.7);
    expect(SmartphoneCategoryMeta.aliases).toContain("smartphones");
    expect(SmartphoneCategoryMeta.aliases).toContain("celulares");
  });
});

describe("Notebook Schema", () => {
  it("should validate notebook specs", () => {
    const specs = {
      display: {
        size_inches: 15.3,
        resolution: "2880x1864",
        technology: "Liquid Retina",
        refresh_rate_hz: 120,
        brightness_nits: 1000,
      },
      processor: {
        name: "Apple M4",
        cpu_cores: 10,
      },
      memory: {
        ram_gb: 24,
        type: "Unified Memory",
      },
      storage: {
        ssd_gb: 512,
        type: "NVMe",
      },
      battery: {
        capacity_wh: 72.4,
        hours_video: 18,
      },
      connectivity: {
        wifi: "Wi-Fi 6E",
        bluetooth: "5.3",
        ports: ["Thunderbolt 4 x2", "MagSafe 3"],
        thunderbolt_ports: 2,
      },
      physical: {
        weight_kg: 1.51,
        thickness_mm: 11.5,
      },
      audio: {
        speakers: "6 alto-falantes com Spatial Audio",
      },
      software: {
        os: "macOS Sonoma",
      },
    };

    const result = NotebookSpecs.safeParse(specs);

    expect(result.success).toBe(true);
  });

  it("should have correct category metadata", () => {
    expect(NotebookCategoryMeta.category).toBe("notebooks");
    expect(NotebookCategoryMeta.min_completeness).toBe(0.7);
  });
});

describe("TV Schema", () => {
  it("should validate TV specs", () => {
    const specs = {
      display: {
        size_inches: 65,
        resolution: "3840x2160",
        technology: "Neo QLED",
        refresh_rate_hz: 120,
        hdr: ["HDR10+", "Dolby Vision"],
      },
      audio: {
        speakers: "60W 4.2.2 canais",
        dolby_atmos: true,
      },
      smart: {
        os: "Tizen",
        voice_assistants: ["Bixby", "Alexa"],
      },
      connectivity: {
        hdmi_ports: 4,
        hdmi_21: 4,
        usb_ports: 2,
        wifi: "Wi-Fi 6",
        bluetooth: "5.2",
      },
      gaming: {
        vrr: true,
        allm: true,
        input_lag_ms: 9.8,
      },
      physical: {
        weight_with_stand_kg: 23.5,
        weight_kg: 21.2,
        vesa: "300x300",
      },
    };

    const result = TVSpecs.safeParse(specs);

    expect(result.success).toBe(true);
  });

  it("should have correct category metadata", () => {
    expect(TVCategoryMeta.category).toBe("tvs");
    expect(TVCategoryMeta.min_completeness).toBe(0.6);
  });
});

describe("Footwear Schema (Moda)", () => {
  it("should validate footwear specs", () => {
    const specs = {
      sizing: {
        available_sizes: ["38", "39", "40", "41", "42"],
        fit: "Regular",
      },
      upper: {
        material: "Mesh respiravel",
        breathability: "Alta",
      },
      midsole: {
        technology: "Nike Air",
        cushioning: "Responsivo",
        drop_mm: 10,
      },
      outsole: {
        material: "Borracha Waffle",
        durability: "Alta",
      },
      weight: {
        grams_per_shoe: 270,
        size_reference: "42",
      },
      style: {
        silhouette: "Low-top",
        closure: "Cadarco",
        colors_available: ["Black/White", "Blue/Red"],
      },
    };

    const result = FootwearSpecs.safeParse(specs);

    expect(result.success).toBe(true);
  });

  it("should have correct category metadata", () => {
    expect(ModaCategoryMeta.category).toBe("moda");
    expect(ModaCategoryMeta.min_completeness).toBe(0.5);
  });
});

describe("Console Schema (Games)", () => {
  it("should validate console specs", () => {
    const specs = {
      processor: {
        cpu: "AMD Zen 2 8-core",
        cpu_frequency_ghz: 3.5,
        gpu: "AMD RDNA 3 custom",
        gpu_tflops: 16.7,
      },
      memory: {
        ram_gb: 16,
        type: "GDDR6",
        bandwidth_gbs: 576,
      },
      storage: {
        ssd_gb: 2000,
        type: "Custom NVMe SSD",
        speed_gbs: 5.5,
      },
      video: {
        max_resolution: "8K",
        target_resolution: "4K",
        hdr: true,
        ray_tracing: "Advanced",
        frame_rate: ["60fps", "120fps"],
        vrr: true,
      },
      audio: {
        technology: "Tempest 3D AudioTech",
        formats: ["Dolby Atmos"],
      },
      connectivity: {
        hdmi: "HDMI 2.1",
        usb: ["USB-A 10Gbps x2", "USB-C 10Gbps x2"],
        wifi: "Wi-Fi 7",
        bluetooth: "5.1",
      },
      features: {
        backwards_compatible: true,
        ps_vr2_compatible: true,
      },
    };

    const result = ConsoleSpecs.safeParse(specs);

    expect(result.success).toBe(true);
  });

  it("should have correct category metadata", () => {
    expect(GamesCategoryMeta.category).toBe("games");
    expect(GamesCategoryMeta.min_completeness).toBe(0.6);
  });
});

describe("Dishwasher Schema (Eletrodomesticos)", () => {
  it("should validate dishwasher specs", () => {
    const specs = {
      capacity: {
        services: 14,
        dishes: 120,
      },
      programs: {
        total: 8,
        list: ["Intensivo", "Normal", "Eco", "Rapido"],
      },
      water: {
        consumption_liters: 9.5,
      },
      energy: {
        energy_rating: "A",
        voltage: "220V",
        consumption_kwh_cycle: 1.2,
      },
      drying: {
        type: "Condensacao",
      },
      noise: {
        db: 44,
      },
      physical: {
        width_cm: 60,
        height_cm: 85,
        depth_cm: 60,
        color: "Inox",
      },
      features: {
        delay_start: true,
        delay_hours: 24,
        half_load: true,
      },
    };

    const result = DishwasherSpecs.safeParse(specs);

    expect(result.success).toBe(true);
  });

  it("should have correct category metadata", () => {
    expect(EletrodomesticosCategoryMeta.category).toBe("eletrodomesticos");
    expect(EletrodomesticosCategoryMeta.min_completeness).toBe(0.6);
  });
});

describe("Category Metadata Consistency", () => {
  it("all categories should have required properties", () => {
    for (const [key, meta] of Object.entries(CATEGORY_METADATA)) {
      expect(meta.category).toBeDefined();
      expect(meta.aliases).toBeDefined();
      expect(meta.min_completeness).toBeGreaterThan(0);
      expect(meta.min_completeness).toBeLessThanOrEqual(1);
      expect(meta.required_specs).toBeDefined();
      expect(meta.comparison_axes).toBeDefined();
    }
  });

  it("all categories should have at least one comparison axis", () => {
    for (const [key, meta] of Object.entries(CATEGORY_METADATA)) {
      expect(meta.comparison_axes.length).toBeGreaterThan(0);
    }
  });
});
